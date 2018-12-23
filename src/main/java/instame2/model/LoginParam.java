package instame2.model;

public class LoginParam {
    private String me2dayId;
    private String instagramUserName;

    public LoginParam(String me2dayId, String instagramUserName) {
        this.me2dayId = me2dayId;
        this.instagramUserName = instagramUserName;
    }

    public String getMe2dayId() {
        return me2dayId;
    }

    public void setMe2dayId(String me2dayId) {
        this.me2dayId = me2dayId;
    }

    public String getInstagramUserName() {
        return instagramUserName;
    }

    public void setInstagramUserName(String instagramUserName) {
        this.instagramUserName = instagramUserName;
    }
}
