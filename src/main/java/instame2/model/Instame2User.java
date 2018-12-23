package instame2.model;

import org.apache.commons.lang.builder.ToStringBuilder;

import com.opensymphony.oscache.util.StringUtil;

public class Instame2User {
    private String me2dayId;
    private String me2dayKey;
    private String me2dayNickname;
    private String instagramUserName;
    private String instagramUserFullName;
    private String instagramSubscriptionId;
    private String instagramObjectId;
    private String instagramAccessTocken;
    private String updateTime;
    private String createTime;

    public String getMe2dayId() {
        return me2dayId;
    }

    public void setMe2dayId(String me2dayId) {
        this.me2dayId = me2dayId;
    }

    public String getMe2dayKey() {
        return me2dayKey;
    }

    public void setMe2dayKey(String me2dayKey) {
        this.me2dayKey = me2dayKey;
    }

    public String getMe2dayNickname() {
        return me2dayNickname;
    }

    public void setMe2dayNickname(String me2dayNickname) {
        this.me2dayNickname = me2dayNickname;
    }

    public String getInstagramUserName() {
        return instagramUserName;
    }

    public void setInstagramUserName(String instagramUserName) {
        this.instagramUserName = instagramUserName;
    }

    public String getInstagramUserFullName() {
        return instagramUserFullName;
    }

    public void setInstagramUserFullName(String instagramUserFullName) {
        this.instagramUserFullName = instagramUserFullName;
    }

    public String getInstagramSubscriptionId() {
        return instagramSubscriptionId;
    }

    public void setInstagramSubscriptionId(String instagramSubscriptionId) {
        this.instagramSubscriptionId = instagramSubscriptionId;
    }

    public String getInstagramObjectId() {
        return instagramObjectId;
    }

    public void setInstagramObjectId(String instagramObjectId) {
        this.instagramObjectId = instagramObjectId;
    }

    public String getInstagramAccessTocken() {
        return instagramAccessTocken;
    }

    public void setInstagramAccessTocken(String instagramAccessTocken) {
        this.instagramAccessTocken = instagramAccessTocken;
    }

    public String getUpdateTime() {
        return updateTime;
    }

    public void setUpdateTime(String updateTime) {
        this.updateTime = updateTime;
    }

    public String getCreateTime() {
        return createTime;
    }

    public void setCreateTime(String createTime) {
        this.createTime = createTime;
    }

    public boolean isMember() {
        return !StringUtil.isEmpty(me2dayId) && !StringUtil.isEmpty(instagramSubscriptionId);
    }

    @Override
    public String toString() {
        return ToStringBuilder.reflectionToString(this);
    }

}
