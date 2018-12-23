package statistics.model;

public class StatisticsLog {
    private String action;
    private String message;
    private String loggingTime;

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getLoggingTime() {
        return loggingTime;
    }

    public void setLoggingTime(String loggingTime) {
        this.loggingTime = loggingTime;
    }
}
