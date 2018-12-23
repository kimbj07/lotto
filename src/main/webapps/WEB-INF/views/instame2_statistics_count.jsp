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

    <script type="text/javascript" src="../js/jquery-latest.js"></script>
    <script type="text/javascript" src="../js/jquery.tablesorter.js"></script>
    <script type="text/javascript"
            src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.7/jquery-ui.min.js"></script>
    <script type="text/javascript" src="../js/date.js"></script>
    <script type="text/javascript" src="../js/daterangepicker.jQuery.js"></script>
    <script type="text/javascript" src="../js/common.js"></script>

    <script type="text/javascript">
        $(function () {
            $('#startDate, #endDate').daterangepicker();
        });
    </script>

    <title>인스타미투 통계 페이지</title>
</head>
<body>
<br />
<div style="margin-left:10px;">
    <form action="showStatisticsCount.nj" method="get" id="target">
        <input type="text" size="10" maxlength="10" value="${startDate}" name="startDate" id="startDate" />
        <label> ~ </label>
        <input type="text" size="10" maxlength="10" value="${endDate}" name="endDate" id="endDate" />
        <select id="actionType" name="actionType">
            <option>all</option>
            <option>posting</option>
            <option>register</option>
            <option>leave</option>
            <option>login</option>
        </select>

        <input type="submit" value="검색" name="searchForm" id="searchForm" />
    </form>
</div>

<div align="right" style="width: 50%">누적 가입자 수 : ${memberTotalCount}명</div>
<table id="LogCountTable" class="tablesorter">
    <thead>
    <tr>
        <th class="header">Date</th>
        <th class="header">Action</th>
        <th class="header">Count</th>
    </tr>
    </thead>
    <tbody>
    <c:forEach items="${instame2StatisticsCount}" var="entry" varStatus="status">
        <tr class="<c:if test="${status.index % 2 == 0}">odd</c:if>" align="left">
            <td>${entry.logDate}</td>
            <td>${entry.action}</td>
            <td>${entry.count}</td>
        </tr>
    </c:forEach>
    </tbody>
</table>

<input type="hidden" name="selectedActionType" id="selectedActionType" value="${actionType}" />

<script type="text/javascript">
    $(document).ready(function () {
        $("#LogCountTable").tablesorter();
        $("#searchForm").click(checkDate);
        $("#actionType").val($("#selectedActionType").val());
    });
</script>
</body>
</html>