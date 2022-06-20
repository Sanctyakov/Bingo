public var ballData : BallData[];
public var bingoLines : LineData[];
public var audioInfo : AudioInfo[];
public var bingoCard : Transform;
public var gamePadCam : Camera;
public var ballPrefab : GameObject;
public var ballsLeftText : TextMesh;
public var playImage : GameObject;
public var winnerImage : GameObject;
public var loserImage : GameObject;

public var waitToStart : float;
public var ballStart : Vector3;
public var ballSpacing : float;
public var ballFadeSpeed : float;
public var ballMoveSpeed : float;
public var timeBetweenCalls : float;
public var ballsPerRound : int;

public var centerDaub : Sprite;
public var flatDaub : Sprite;

private var numbersNotYetCalled : ArrayList = new ArrayList();
private var numbersCalled : ArrayList = new ArrayList();
private var numbersCalledPositions : ArrayList = new ArrayList();
public var ballList : ArrayList = new ArrayList();
private var myCard : CardData[,];
private var hasBingo : boolean;
private var inPlay : boolean;
private var bingoed : boolean;
private var daubs : GameObject;
private var bingoBalls : GameObject;
private var currentBall : GameObject;
private var currentMovePosition : float;
private var timeTilNextCall : float;
private var showingBalls : boolean;
private var previousTime : int;
private var thisAudioSource : AudioSource;
private var bingoAudioSource : AudioSource;

function Awake()
{
	for(var i = 0; i < 75; i++) numbersCalledPositions.Add(GameObject.Find((i + 1).ToString()));
	numbersCalledPositions = SortArrayByNumberName(numbersCalledPositions);
	for(var a = 0; a < 5; a++)
	{
		for(var b = 0; b < 15; b++)
		{
			numbersCalledPositions[a * 15 + b].gameObject.GetComponent("TextMesh").text = ((a * 15 + b) + 1).ToString();
		}
	}
	playImage.SetActive(true);
	thisAudioSource = GetComponent.<AudioSource>();
	bingoAudioSource = bingoCard.GetComponent.<AudioSource>();
}

function Update()
{
	if(winnerImage.activeSelf || loserImage.activeSelf)
	{
		if(Input.anyKeyDown)
		{
			if(winnerImage.activeSelf) winnerImage.SetActive(false);
			if(loserImage.activeSelf) loserImage.SetActive(false);
			playImage.SetActive(true);
		}
	}
	else if(Input.GetMouseButtonDown(0)) CheckMousePosition();
	if(bingoBalls)
	{
		if(bingoBalls.transform.position.x != currentMovePosition) bingoBalls.transform.position.x = Mathf.MoveTowards(bingoBalls.transform.position.x, currentMovePosition, ballMoveSpeed * Time.deltaTime);
		if(ballList.Count > 0)
		{
			
			if(ballList[ballList.Count - 1].transform.localScale != Vector3(1, 1, 1))
			{
				ballList[ballList.Count - 1].transform.localScale = Vector3.MoveTowards(ballList[ballList.Count - 1].transform.localScale, Vector3(1, 1, 1), ballFadeSpeed * Time.deltaTime);
			}
			else
			{
				if(ballList[ballList.Count - 1].transform.parent != bingoBalls.transform) ballList[ballList.Count - 1].transform.parent = bingoBalls.transform;
			}
			if(ballList.Count > 6)
			{
				if(ballList[0].transform.localScale != Vector3.zero)
				{
					ballList[0].transform.localScale = Vector3.MoveTowards(ballList[0].transform.localScale, Vector3.zero, ballFadeSpeed * Time.deltaTime);
				}
				else
				{
					var tmp = ballList[0];
					ballList.RemoveAt(0);
					Destroy(tmp);
				}
			}
		}
	}
	if(inPlay)
	{
		if(numbersNotYetCalled.Count > -1)
		{
			timeTilNextCall -= Time.deltaTime;
			if(timeTilNextCall <= 0.0)
			{
				CallNextNumber();
				timeTilNextCall = timeBetweenCalls;
			}
		}
		if(showingBalls)
		{
			if(ballsLeftText.text != numbersNotYetCalled.Count.ToString())
			{
				ballsLeftText.text = numbersNotYetCalled.Count.ToString();
			}
		}
		
	}
	if(!inPlay)
	{
		if(ballsLeftText.text != "")
		{
			ballsLeftText.text = "";
		}
	}
}

function TickNumberOnCardIfFound(ID : int)
{
	for(var a = 0; a < 5; a++)
	{
		for(var b = 0; b < 5; b++)
		{
			if(myCard[a, b].number == ID)
			{
				if(!myCard[a, b].hasNumber) myCard[a, b].hasNumber = true;
				return;
			}
		}
	}
}

function CheckMousePosition()
{
	var hit : RaycastHit;
	var ray : Ray = gamePadCam.ScreenPointToRay(Input.mousePosition);
	if(Physics.Raycast(ray, hit, 20))
	{
		if(hit.collider.gameObject.CompareTag("Item") && inPlay)
		{
			var coord : Vector2 = GetGridCoord(hit.transform.gameObject);
			if(!HasCalledNumber(myCard[coord.x, coord.y].number) && myCard[coord.x, coord.y].clickedPosition)
			{
				myCard[coord.x, coord.y].clickedPosition = false;
				Destroy(myCard[coord.x, coord.y].daub);
				myCard[coord.x, coord.y].daub = null;
				bingoAudioSource.clip = audioInfo[2].clip;
				bingoAudioSource.Play();
				return;
			} 
			if(!myCard[coord.x, coord.y].clickedPosition)
			{
				myCard[coord.x, coord.y].clickedPosition = true;
				myCard[coord.x, coord.y].daub = DaubPosition(hit.transform.gameObject, false);
				if(HasBingo()) hasBingo = true;
			}
		}
		if(hit.collider.gameObject.CompareTag("GameController"))
		{
			if(inPlay)
			{
				if(hasBingo) EndGame(1);
				else print("Do not have bingo");
			}
		}
		if(hit.collider.gameObject == playImage) BeginGame();
	}
}

function DaubPosition(pos : GameObject, special : boolean)
{
	var obj = new GameObject();
	obj.AddComponent.<SpriteRenderer>();
	var rend = obj.GetComponent.<SpriteRenderer>();
	if(!special) rend.sprite = flatDaub;
	else rend.sprite = centerDaub;
	rend.sortingOrder = -1;
	obj.transform.position = pos.transform.position;
	obj.transform.parent = daubs.transform;
	if(!special)
	{
		bingoAudioSource.clip = audioInfo[3].clip;
		bingoAudioSource.Play();
	}
	return obj;
}

function GenerateParents()
{
	if(daubs) Destroy(daubs);
	var daubsParent = new GameObject();
	daubsParent.name = "Daubs";
	daubs = daubsParent;
	
	if(bingoBalls) Destroy(bingoBalls);
	var ballParent = new GameObject();
	ballParent.name = "BingoBalls";
	bingoBalls = ballParent;
}

function BeginGame()
{
	GenerateParents();
	currentMovePosition = 0;
	myCard = GenerateCard();
	inPlay = true;
	hasBingo = false;
	bingoed = false;
	timeTilNextCall = waitToStart;
	playImage.SetActive(false);
	previousTime = waitToStart;
	bingoAudioSource.clip = audioInfo[4].clip;
	bingoAudioSource.Play();
}

function EndGame(won : int)
{
	if(won > 0)
	{
		winnerImage.SetActive(true);
		bingoAudioSource.clip = audioInfo[5].clip;
	}
	if(won == 0)
	{
		loserImage.SetActive(true);
		bingoAudioSource.clip = audioInfo[6].clip;
	}
	bingoAudioSource.Play();
	ballList = new ArrayList();
	hasBingo = false;
	bingoed = false;
	inPlay = false;
	showingBalls = false;
	EraseCard();
}

function EraseCard()
{
	Destroy(daubs);
	Destroy(bingoBalls);
	for(var child : Transform in bingoCard) child.GetComponent.<TextMesh>().text = "";
}

function GenerateCard()
{
	ShuffleBingoBalls();
	var thisCard : CardData[,] = new CardData[5, 5];
	
	var numberChildren : ArrayList = new ArrayList();
	for(var child : Transform in bingoCard) numberChildren.Add(child);
	SortArrayByName(numberChildren);
	
	for(var a = 0; a < 5; a++)
	{
		var numbers = ShuffleNumbers(15);
		for(var b = 0; b < 5; b++)
		{
			thisCard[a, b] = new CardData();
			if(a == 2 && b == 2)
			{
				thisCard[a, b].number = 99;
				thisCard[a, b].hasNumber = true;
				thisCard[a, b].clickedPosition = true;
				thisCard[a, b].daub = DaubPosition(GameObject.Find("CC"), true);
			}
			else
			{
				thisCard[a, b].number = a * 15 + numbers[b];
				thisCard[a, b].obj = numberChildren[a * 5 + b].gameObject;
				numberChildren[a * 5 + b].gameObject.GetComponent("TextMesh").text = (thisCard[a,b].number + 1).ToString();
			}
		}
	}
	return thisCard;
}

function SortArrayByName(myList : ArrayList)
{
	var tmp : ArrayList = new ArrayList();
	for(var a = 0; a < myList.Count; a++) tmp.Add(myList[a].name);
	tmp.Sort();
	for(var b = 0; b < tmp.Count; b++) myList[b] = GameObject.Find(tmp[b]);
}

function SortArrayByNumberName(a : ArrayList)
{
	var temp : GameObject[] = new GameObject[a.Count];
	var i : int;
	for(i = 0; i < a.Count; i++) temp[parseInt(a[i].name) - 1] = a[i];
	var newSet : ArrayList = new ArrayList();
	for(i = 0; i < a.Count; i++) newSet.Add(temp[i]);
	return newSet;
}

function ShuffleBingoBalls()
{
	numbersCalled.Clear();
	numbersNotYetCalled = ShuffleNumbers(75);
}

function ShuffleNumbers(max : int)
{
	var numberArray = new ArrayList();
	for(var a = 0; a < max; a++) numberArray.Add(a);
	for(var b = max - 1; b > 0; b--)
	{
		var r = Random.Range(0, b);
		var tmp = numberArray[b];
		numberArray[b] = numberArray[r];
		numberArray[r] = tmp;
	}
	if(numberArray.Count - ballsPerRound > 0) numberArray = RemoveLeftOverBalls(numberArray);
	return numberArray;
}

function RemoveLeftOverBalls(numbersList : ArrayList)
{
	for(var i = numbersList.Count - ballsPerRound; i > 0; i--)
	{
		numbersList.RemoveAt(numbersList.Count - 1);
	}
	return numbersList;
}

function HasCalledNumber(number : int)
{
	for(var a = 0; a < numbersCalled.Count; a++)
	{
		if(number == numbersCalled[a]) return true;
	}
	return false;
}

function CallNextNumber()
{
	if(numbersNotYetCalled.Count == 0)
	{
		EndGame(0);
		return;
	}
	
	if(!showingBalls) showingBalls = true;
	
	var obj = Instantiate(ballPrefab, ballStart, Quaternion.identity);
	var calledDaub : GameObject = new GameObject();
	
	currentMovePosition += ballSpacing;
	
	thisAudioSource.clip = audioInfo[0].clip;
	thisAudioSource.Play();
	
	yield WaitForSeconds(0.25);
	
	var pos = FindGridPos(numbersNotYetCalled[0]);
	
	obj.GetComponent.<TextMesh>().text = (numbersNotYetCalled[0] + 1).ToString();
	obj.transform.GetChild(0).GetComponent.<SpriteRenderer>().sprite = ballData[pos.x].image;
	
	calledDaub.AddComponent.<SpriteRenderer>();
	var cRend = calledDaub.GetComponent.<SpriteRenderer>();
	cRend.sprite = ballData[pos.x].daub;
	cRend.sortingOrder = -1;
	calledDaub.transform.position = numbersCalledPositions[numbersNotYetCalled[0]].transform.position;
	
	obj.transform.localScale = Vector3.zero;
	ballList.Add(obj);
	
	calledDaub.transform.localScale = Vector3(1, 1, 1);
	calledDaub.transform.parent = daubs.transform;
	
	TickNumberOnCardIfFound(numbersNotYetCalled[0]);
	
	numbersCalled.Add(numbersNotYetCalled[0]);
	numbersNotYetCalled.RemoveAt(0);
}

function FindGridPos(number : int)
{
	var pos : Vector2;
	if(number < 15) pos = Vector2(0, number);
	if(number > 14 && number < 30) pos = Vector2(1, number - 15);
	if(number > 29 && number < 45) pos = Vector2(2, number - 30);
	if(number > 44 && number < 60) pos = Vector2(3, number - 45);
	if(number > 59) letter = pos = Vector2(4, number - 60);
	return pos;
}

function HasBingo()
{
	for(var a = 0; a < bingoLines.Length; a++)
	{
		for(var b = 0; b < bingoLines[a].line.Length; b++)
		{
			var gridPos : Vector2 = bingoLines[a].line[b];
			if(myCard[gridPos.x, gridPos.y].hasNumber && myCard[gridPos.x, gridPos.y].clickedPosition)
			{
				if(b == bingoLines[a].line.Length - 1)
				{
					return true;
				}
				continue;
			}
			break;
		}
	}
	return false;
}

function GetGridCoord(obj : GameObject)
{
	for(var a = 0; a < 5; a++)
	{
		for(var b = 0; b < 5; b++)
		{
			if(inPlay)
			{
				if(myCard[a, b].obj == obj) return Vector2(a, b);
			}
		}
	}
}

function OnGUI()
{
	GUI.color = Color.red;
	GUI.skin.label.alignment = TextAnchor.MiddleCenter;
	if(inPlay && !showingBalls)
	{
		GUI.Box(Rect(Screen.width/2 - 80, Screen.height/2 - 50, 160, 100), "");
		GUI.skin.label.fontSize = 60.0;
		var curTime = timeTilNextCall.ToString("n0");
		var intTime = parseInt(curTime);
		if(previousTime != intTime)
		{
			if(intTime != 0) thisAudioSource.clip = audioInfo[1].clip;
			else thisAudioSource.clip = audioInfo[2].clip;
			thisAudioSource.Play();
			previousTime = intTime;
		}
		if(intTime > 0) 
		{
			if(intTime < 4) GUI.color = Color.yellow;
			GUI.Label(Rect(Screen.width/2 - 80, Screen.height/2 - 50, 160, 100), timeTilNextCall.ToString("n0"));
		}
		else
		{
			GUI.color = Color.green;
			GUI.Label(Rect(Screen.width/2 - 80, Screen.height/2 - 50, 160, 100), "GO");
		}
	}
}