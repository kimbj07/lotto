<%@page contentType="text/html;charset=utf-8" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">

    <link rel="stylesheet" href="../css/jq.css" type="text/css" media="print, projection, screen" />
    <link rel="stylesheet" href="../css/statistics_style.css" type="text/css"
          media="print, projection, screen" />
    <link rel="stylesheet"
          href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.7/themes/redmond/jquery-ui.css"
          type="text/css" />
    <link rel="stylesheet" href="../css/ui.daterangepicker.css" type="text/css" />

    <title>인스타미투 통계 수집</title>
</head>
<body>
<div style="margin-left:10px;">
    <form action="executeStatisticsJob.nj" method="get">
        <input type="text" size="10" maxlength="10" name="logDate" id="logDate" />
        <input type="submit" value="실행" />
    </form>
</div>
</body>
</html>