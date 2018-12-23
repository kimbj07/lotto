package lotto.param;

public class GameInfoInRangeParam {
    private Integer from;
    private Integer to;
    private String order;

    public GameInfoInRangeParam() {
    }

    public GameInfoInRangeParam(Integer from, Integer to, String order) {
        this.from = from;
        this.to = to;
        this.order = order;
    }

    public Integer getFrom() {
        return from;
    }

    public void setFrom(Integer from) {
        this.from = from;
    }

    public Integer getTo() {
        return to;
    }

    public void setTo(Integer to) {
        this.to = to;
    }

    public String getOrder() {
        return Order.getOrder(order).name();
    }

    public void setOrder(String order) {
        this.order = order;
    }
}
