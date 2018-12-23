<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<%@taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
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

    </script>
</head>

<body>
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
                        <c:if test="${empty instame2UserInfo}">
                            <p class="text"> 인스타미투는 <strong>인스타그램에서 찍은 멋진 사진을 미투데이에도 자동으로 올려주는</strong> 편리한
                                서비스입니다. <strong><a
                                        href="http://itunes.apple.com/app/id322934412">미투데이</a></strong>와
                                <strong><a href="http://itunes.apple.com/app/id389801252">인스타그램</a></strong> 계정만
                                있다면 이미 준비 완료!</p>
                        </c:if>
                        <c:if test="${!empty me2dayAuthUrl}">
                            <p align="center" class="text">방법도 매우 간단해요. 일단 <strong>미투데이에 로그인</strong>해볼까요?</p>
                            <br />
                        </c:if>
                        <c:if test="${!empty instagramAuthUrl}">
                            <p align="center" class="text">미투데이 로그인에 성공했습니다. 이제 <strong>인스타그램에도 로그인</strong>해주세요!
                            </p><br />
                        </c:if>
                        <c:if test="${!empty instame2UserInfo}">
                            <p align="center" class="text">짜잔~ <strong>미투데이와 인스타그램의 연동 설정이 완료</strong>되었습니다!</p>
                            <p class="text">이제 <strong>인스타그램에서 사진을 업로드하면 동일한 내용이 내 미투데이에도 자동으로 등록</strong>됩니다.
                                많이 이용해주시고, 아래 "미투" 버튼도 꾹 눌러주시고 가세요 ' ㅁ')b</p>
                            <p>
                            <ul>
                                <li class="text">위치정보도 미투데이에 동일하게 등록되며 위치명은 태그로 등록됩니다</li>
                                <li class="text">캡션이 145자를 넘으면 미투데이에는 끝이 "..."로 줄여져서 등록됩니다</li>
                                <li class="text">미투 끝에 달린 ☆을 클릭하시면 인스타그램의 자체 페이지로 이동합니다</li>
                            </ul>
                            </p>
                            <p align="center" class="text"><strong>연동 해제는 <a href="http://instame2.com/main.nj">첫
                                화면</a>으로 돌아가서 다시 한 번 로그인</strong>해주시면 됩니다. 쉽죠?</p><br />
                        </c:if>
                        <center>
                            <table width="480" border="0" align="center" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td width="180" height="40" align="center" valign="middle"
                                        background="../images/login-me2-l.jpg">&nbsp;
                                    </td>
                                    <c:if test="${!empty me2dayAuthUrl}">
                                        <td width="300" height="40" align="center" valign="middle"
                                            background="../images/login-me2-r.jpg" class="login"><a
                                                onclick="execute('${me2dayAuthUrl}');">여기를 클릭해서 로그인!</a></td>
                                    </c:if>
                                    <c:if test="${!empty instagramAuthUrl}">
                                        <td width="300" height="40" align="center" valign="middle"
                                            background="../images/login-me2-r.jpg" class="loggedin"><font
                                                color="e2acff">${me2dayUserInfo.userId}
                                            / ${me2dayUserInfo.nickname}</font></td>
                                    </c:if>
                                    <c:if test="${!empty instame2UserInfo}">
                                        <td width="300" height="40" align="center" valign="middle"
                                            background="../images/login-me2-r.jpg" class="loggedin"><font
                                                color="e2acff">${instame2UserInfo.me2dayId}
                                            / ${instame2UserInfo.me2dayNickname}</font></td>
                                    </c:if>
                                </tr>
                                <tr>
                                    <td height="10" align="center" valign="middle">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td width="180" height="40" align="center" valign="middle"
                                        background="../images/login-insta-l.jpg">&nbsp;
                                    </td>
                                    <c:if test="${!empty me2dayAuthUrl}">
                                        <td width="300" height="40" align="center" valign="middle"
                                            background="../images/login-insta-r.jpg" class="login_dimmed">여기를
                                            클릭해서 로그인!
                                        </td>
                                    </c:if>
                                    <c:if test="${!empty instagramAuthUrl}">
                                        <td width="300" height="40" align="center" valign="middle"
                                            background="../images/login-insta-r.jpg" class="login"><a
                                                onclick="execute('${instagramAuthUrl}');">여기를 클릭해서 로그인!</a></td>
                                    </c:if>
                                    <c:if test="${!empty instame2UserInfo}">
                                        <td width="300" height="40" align="center" valign="middle"
                                            background="../images/login-insta-r.jpg" class="loggedin"><font
                                                color="cec5b9">${instame2UserInfo.instagramUserName} /
                                            <c:choose>
                                                <c:when test="${empty instame2UserInfo.instagramUserFullName}"> 사용자명 미등록 </c:when>
                                                <c:otherwise>${instame2UserInfo.instagramUserFullName}</c:otherwise>
                                            </c:choose>
                                        </font></td>
                                    </c:if>
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