package lotto.model;

import org.apache.commons.lang.builder.ToStringBuilder;

public class AppearanceCount {
    private int number;
    private int winCount;
    private int bonusCount;
    private int sumCount;

    public int getNumber() {
        return number;
    }

    public void setNumber(int number) {
        this.number = number;
    }

    public int getWinCount() {
        return winCount;
    }

    public void setWinCount(int winCount) {
        this.winCount = winCount;
    }

    public int getBonusCount() {
        return bonusCount;
    }

    public void setBonusCount(int bonusCount) {
        this.bonusCount = bonusCount;
    }

    public int getSumCount() {
        return sumCount;
    }

    public void setSumCount(int sumCount) {
        this.sumCount = sumCount;
    }

    public String toString() {
        return ToStringBuilder.reflectionToString(this);
    }
}
