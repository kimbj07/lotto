<%@page contentType="text/html;charset=utf-8"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">

<link rel="stylesheet" href="../css/jq.css" type="text/css" media="print, projection, screen" />
<link rel="stylesheet" href="../css/statistics_style.css" type="text/css" media="print, projection, screen" />
<link rel="stylesheet" href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.7/themes/redmond/jquery-ui.css" type="text/css" />
<link rel="stylesheet" href="../css/ui.daterangepicker.css" type="text/css" />

<script type="text/javascript" src="../js/jquery-latest.js"></script>
<script type="text/javascript" src="../js/jquery.tablesorter.js"></script>
<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.7/jquery-ui.min.js"></script>
<script type="text/javascript" src="../js/date.js"></script>
<script type="text/javascript" src="../js/daterangepicker.jQuery.js"></script>
<script type="text/javascript" src="../js/page.js"></script>
<script type="text/javascript" src="../js/common.js"></script>

<script type="text/javascript">
	$(function() {
		$('#startDate, #endDate').daterangepicker();
	});
</script>

<title>인스타미투 통계 페이지</title>
</head>
<body>
	<br/>
	<div style="margin-left:10px;">
		<form action="/showRawStatistics.nj" method="get" id="target">
			<input type="text" size="10" maxlength="10" value="${startDate}" name="startDate" id="startDate" />
			<label> ~ </label>
			<input type="text" size="10" maxlength="10" value="${endDate}" name="endDate" id="endDate" />
			<select id="pageSize" name="pageSize">
				<option>10</option>
				<option>20</option>
				<option>30</option>
				<option>40</option>
				<option>50</option>
			</select>
			
			<input type="submit" value="검색" name="searchForm" id="searchForm" />
			<input type="hidden" name="page" id="page" value="${page}" />
		</form>
	</div>
	
	<div style="width:50%;text-align:right">전체 건수 : <span id="totalCount">${totalCount}</span>건</div>
	<table id="rawLogTable" class="tablesorter">
		<thead>
			<tr>
				<th class="header">Action</th>
				<th class="header">Message</th>
				<th class="header">LoggingTime</th>
			</tr>
		</thead>
		<tbody>
			<c:forEach items="${instame2RawStatistics}" var="entry" varStatus="status">
				<tr class="<c:if test="${status.index % 2 == 0}">odd</c:if>" align="left">
					<td>${entry.action}</td>
					<td>${entry.message}</td>
					<td align="center">${entry.loggingTime}</td>
				</tr>
			</c:forEach>
		</tbody>
	</table>
	
	<input type="hidden" name="pageCount" id="pageCount"/>
	<input type="hidden" name="selectedPageSize" id="selectedPageSize" value="${pageSize}"/>
	
	<script type="text/javascript">
		$(document).ready(function() {
			$("#rawLogTable").tablesorter();
			$("#searchForm").click(checkDate);
			
			$("#pageSize").val($("#selectedPageSize").val());
			
			var totalCount = parseInt($("#totalCount").html());
			$("#pageCount").val(Math.ceil(totalCount / $("#pageSize").val()));
			generateRows($("#page").val());
		});
	</script>
</body>
</html>