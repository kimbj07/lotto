var datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isInvalidDate(date) {
	return !datePattern.test(date);
}

function checkDate() {
	if (isInvalidDate($("#startDate").val())) {
		alert("시작날짜가 잘못되었습니다.");
		$("#startDate").focus();
		return false;
	} else if (isInvalidDate($("#endDate").val())) {
		alert("종료날짜가 잘못되었습니다.");
		$("#endDate").focus();
		return false;
	}
	
	return true;
}