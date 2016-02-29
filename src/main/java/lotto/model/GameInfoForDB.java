package lotto.model;

import java.util.ArrayList;
import java.util.List;

public class GameInfoForDB extends GameInfo {
	private int firstBall;
	private int secondBall;
	private int thirdBall;
	private int fourthBall;
	private int fifthBall;
	private int sixthBall;

	private int autoWinnerCount;
	private int manualWinnerCount;

	public int getFirstBall() {
		return firstBall;
	}

	public void setFirstBall(int firstBall) {
		this.firstBall = firstBall;
	}

	public int getSecondBall() {
		return secondBall;
	}

	public void setSecondBall(int secondBall) {
		this.secondBall = secondBall;
	}

	public int getThirdBall() {
		return thirdBall;
	}

	public void setThirdBall(int thirdBall) {
		this.thirdBall = thirdBall;
	}

	public int getFourthBall() {
		return fourthBall;
	}

	public void setFourthBall(int fourthBall) {
		this.fourthBall = fourthBall;
	}

	public int getFifthBall() {
		return fifthBall;
	}

	public void setFifthBall(int fifthBall) {
		this.fifthBall = fifthBall;
	}

	public int getSixthBall() {
		return sixthBall;
	}

	public void setSixthBall(int sixthBall) {
		this.sixthBall = sixthBall;
	}

	public int getAutoWinnerCount() {
		return autoWinnerCount;
	}

	public void setAutoWinnerCount(int autoWinnerCount) {
		this.autoWinnerCount = autoWinnerCount;
	}

	public int getManualWinnerCount() {
		return manualWinnerCount;
	}

	public void setManualWinnerCount(int manualWinnerCount) {
		this.manualWinnerCount = manualWinnerCount;
	}

	public List<Integer> getNumbers() {
		List<Integer> numbers = new ArrayList<Integer>();
		numbers.add(firstBall);
		numbers.add(secondBall);
		numbers.add(thirdBall);
		numbers.add(fourthBall);
		numbers.add(fifthBall);
		numbers.add(sixthBall);
		return numbers;
	}
}