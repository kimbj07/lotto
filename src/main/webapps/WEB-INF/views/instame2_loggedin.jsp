<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<%@taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport"
          content="width=device-width, initial-scale=0.5, maximum-scale=1.0, minimum-scale=0.5, " />

    <title>인스타미투: 미투데이를 즐기는 새로운 방법!</title>

    <script type="text/javascript">
        function execute(authUrl) {
            location.href = authUrl;
        }
    </script>
    <script type="text/javascript" charset="UTF-8"
            src="http://static.plugin.me2day.com/js/plugins_v1.js"></script>

    <meta property="me2:post_body"
          content='[instame2] 인스타그램에서 찍은 사진을 곧바로 미투데이로, "instame2.com":http://instame2.com  오픈!!' />
    <meta property="me2:post_tag" content='instame2 태그로 검색하시면 인스타미투를 통해 올라온 다양한 사진들을 모아보실 수 있어요' />
    <meta property="me2:image"
          content='http://qrcodethumb.phinf.naver.net/20120219_270/enkeivy_1329662366538xAwbr_PNG/02FPm.png' />

    <link href="../css/style.css" rel="stylesheet" type="text/css" />
    <script type="text/javascript">

        var _gaq = _gaq || [];
        _gaq.push(['_setAccount', 'UA-27973132-1']);
        _gaq.push(['_trackPageview']);

        (function () {
            var ga = document.createElement('script');
            ga.type = 'text/javascript';
            ga.async = true;
            ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') +
                     '.google-analytics.com/ga.js';
            var s = document.getElementsByTagName('script')[0];
            s.parentNode.insertBefore(ga, s);
        })();

        function leaveInstame2() {
            if (confirm("연동 설정을 해제하시겠습니까?")) {
                document.leave.submit();
            }
        }

    </script>
</head>

<body>
<form action="leave.nj" name="leave" method="post">
    <input type="hidden" name="me2dayId" value="${instame2UserInfo.me2dayId}" />
    <input type="hidden" name="instagramUserName" value="${instame2UserInfo.instagramUserName}" />
</form>
<table width="600" border="0" align="center" cellpadding="0" cellspacing="0">
    <tr>
        <td height="400" align="left" valign="top" background="../images/instame2-header.jpg">&nbsp;</td>
    </tr>
    <tr>
        <td>
            <table width="600" border="0" cellspacing="0" cellpadding="0">
                <tr>
                    <td width="60" valign="bottom">
                        <div style="width:60px;height:40px;background-image:URL('../images/instame2-bottom-left.png')">
                            &nbsp;
                        </div>
                    </td>
                    <td width="480"><br />
                        <p class="text">이미 <strong>인스타미투를 이용 중</strong>인 분이시로군요! 연동 해제 후에도 몇 번이고 재설정이 가능하니, 멋진
                            사진이 땡길 땐 다시금 들러주세요. 그동안 즐거웠어요 = ㅁ=)</p>
                        <p align="center" class="text">연동 해제를 원하시면 <strong><a style="cursor:pointer;"
                                                                              onclick="leaveInstame2();">"여기"</a></strong>를
                            눌러주세요!</p><br />
                        <center>
                            <table width="480" border="0" align="center" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td width="180" height="40" align="center" valign="middle"
                                        background="../images/login-me2-l.jpg">&nbsp;
                                    </td>
                                    <td width="300" height="40" align="center" valign="middle"
                                        background="../images/login-me2-r.jpg" class="loggedin"><font
                                            color="e2acff"> ${instame2UserInfo.me2dayId}
                                        / ${instame2UserInfo.me2dayNickname} </font></td>
                                </tr>
                                <tr>
                                    <td height="10" align="center" valign="middle">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td width="180" height="40" align="center" valign="middle"
                                        background="../images/login-insta-l.jpg">&nbsp;
                                    </td>
                                    <td width="300" height="40" align="center" valign="middle"
                                        background="../images/login-insta-r.jpg" class="loggedin"><font
                                            color="cec5b9">${instame2UserInfo.instagramUserName} /
                                        <c:choose>
                                            <c:when test="${empty instame2UserInfo.instagramUserFullName}"> 사용자명 미등록 </c:when>
                                            <c:otherwise>${instame2UserInfo.instagramUserFullName}</c:otherwise>
                                        </c:choose>
                                    </font></td>
                                </tr>
                            </table>
                            <br /><br />
                            <me2:metoo layout="large" profile_images="right" color="dark" pingback="checked"
                                       href="http://instame2.com/main.nj"
                                       plugin_key="-DuCXtlaRB6F7SVVPFz1-g"></me2:metoo><br /><br /><br />
                            <me2:comment width="480" count="5" color="light" pingback="checked"
                                         href="http://instame2.com/main.nj"
                                         plugin_key="-DuCXtlaRB6F7SVVPFz1-g"></me2:comment>
                        </center>
                    </td>
                    <td width="60" valign="bottom">
                        <div style="width:60px;height:40px;background-image:URL('../images/instame2-bottom-right.png')">
                            &nbsp;
                        </div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
    <tr>
        <td height="40" background="../images/instame2-bottom-bottom.png">&nbsp;</td>
    </tr>
    <tr>
        <td class="footer">Designed by <a href="http://me2day.net/enkeivy">후나</a> & Developed by <a
                href="http://me2day.net/kimbj07">농부</a> | "Instagram" and "me2day" are registered trademarks of
            their respective owners.
        </td>
    </tr>
</table>

</body>
</html>
