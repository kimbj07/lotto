package lotto.model;

import java.util.SortedSet;

public class GameInfoForApi extends GameInfo {
    private SortedSet<Integer> balls;

    public SortedSet<Integer> getBalls() {
        return balls;
    }

    public void setBalls(SortedSet<Integer> balls) {
        this.balls = balls;
    }
}
