package lotto.model;

public class MyRankInGame {
    private int gameNo;
    private int winNumberCount;
    private int bounsNumberCount;

    public int getGameNo() {
        return gameNo;
    }

    public void setGameNo(int gameNo) {
        this.gameNo = gameNo;
    }

    public int getWinNumberCount() {
        return winNumberCount;
    }

    public void setWinNumberCount(int winNumberCount) {
        this.winNumberCount = winNumberCount;
    }

    public int getBounsNumberCount() {
        return bounsNumberCount;
    }

    public void setBounsNumberCount(int bounsNumberCount) {
        this.bounsNumberCount = bounsNumberCount;
    }

    @Override
    public String toString() {
        return String.format("%d : %d", gameNo, winNumberCount);
    }
}
