<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>instaâme2</title>
    <style type="text/css">
        body {
            margin-top: 0px;
            background-image: url(http://www.kjsc.org/enkeivy/background.png);
            background-repeat: repeat-x;
            text-align: left;
            line-height: normal;
            font-family: "나눔고딕";
        }

        .footer {
            font-size: 9px;
            color: #333;
            text-align: center;
        }
    </style>

    <script type="text/javascript">

        function execute(authUrl) {
            location.href = authUrl;
        }

    </script>

</head>

<body>
<table width="600" border="0" align="center" cellpadding="0" cellspacing="0">
    <tr>
        <td height="400" align="left" valign="top" background="http://www.kjsc.org/enkeivy/instame2-header.jpg">
            &nbsp;
        </td>
    </tr>
    <tr>
        <td>
            <table width="600" border="0" cellspacing="0" cellpadding="0">
                <tr>
                    <td width="60">&nbsp;</td>
                    <td width="480" height="100" valign="top">요기도 뭐가 있었는데...<p><br />
                    </p>
                        <p align="center">여기 소개말이 뭐였지??</p></br>
                        <center>
                            <input type="button" value="me2day 로그인" onclick="execute('${me2dayAuthUrl}');"
                                   style="width:120px; height:30px">
                        </center>
                    </td>
                    <td width="60">&nbsp;</td>
                </tr>
            </table>
        </td>
    </tr>
    <tr>
        <td height="80" background="http://www.kjsc.org/enkeivy/instame2-bottom.jpg">&nbsp;</td>
    </tr>
    <tr>
        <td class="footer"> Copyright Â© 2011 by instame2. Instagram and me2day are registered trademarks of
            their respective owners.
        </td>
    </tr>
</table>

</body>
</html>
