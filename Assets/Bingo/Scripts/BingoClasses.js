class BallData
{
	var Name : String;
	var image : Sprite;
	var daub : Sprite;
	var audioClip : AudioClip;
}

class CardData
{
	var number : int;
	var hasNumber : boolean;
	var clickedPosition : boolean;
	var daub : GameObject;
	var obj : GameObject;
	
	function CardData()
	{
		hasNumber = false;
	}
}

class LineData
{
	var Name : String;
	var line : Vector2[];
}

class AudioInfo
{
	var Name : String;
	var clip : AudioClip;
	var volume : float;
}