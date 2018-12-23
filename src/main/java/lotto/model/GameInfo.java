package lotto.model;

import java.util.Date;

public class GameInfo {
    private int gameNo;
    private Date gameDate;

    private int bonusBall;

    private int firstWinnerCount;
    private long firstWinnerAmount;
    private long totalSellAmount;

    public int getGameNo() {
        return gameNo;
    }

    public void setGameNo(int gameNo) {
        this.gameNo = gameNo;
    }

    public int getBonusBall() {
        return bonusBall;
    }

    public void setBonusBall(int bonusBall) {
        this.bonusBall = bonusBall;
    }

    public Date getGameDate() {
        return gameDate;
    }

    public void setGameDate(Date gameDate) {
        this.gameDate = gameDate;
    }

    public int getFirstWinnerCount() {
        return firstWinnerCount;
    }

    public void setFirstWinnerCount(int firstWinnerCount) {
        this.firstWinnerCount = firstWinnerCount;
    }

    public long getFirstWinnerAmount() {
        return firstWinnerAmount;
    }

    public void setFirstWinnerAmount(long firstWinnerAmount) {
        this.firstWinnerAmount = firstWinnerAmount;
    }

    public long getTotalSellAmount() {
        return totalSellAmount;
    }

    public void setTotalSellAmount(long totalSellAmount) {
        this.totalSellAmount = totalSellAmount;
    }
}