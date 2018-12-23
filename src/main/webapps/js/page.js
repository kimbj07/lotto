var _ELLIPSIS_DIV_HTML = "<div style='float:left;padding-left:6px;padding-right:6px;'>...</div>";
var _EMPTY_DIV = "<div style='clear:both;'></div>";

function createPaginatorDivSelectedPageHtml(page) {
    return "<a href='#' class='pagor selected'>" + page + "</a>";
}

function createPaginatorDivDefaultPageHtml(page) {
    return "<a href='#' class='pagor'>" + page + "</a>";
}

function createPaginatorDivInnerHtml(startPage, endPage, selectedPage) {
    var divHtml = "";

    for (var page = startPage; page <= endPage; page++) {
        if (page == selectedPage) {
            divHtml += createPaginatorDivSelectedPageHtml(page);
        } else {
            divHtml += createPaginatorDivDefaultPageHtml(page);
        }
    }

    return divHtml;
}

function createPaginatorDivHtml(pages, selected) {
    var pages = Number(pages);
    var selected = Number(selected);

    if (pages <= 0) {
        return;
    }

    var divHtml = "<div id='paginator_align'><div id='paginator'>";

    if (pages <= 5) {
        divHtml += createPaginatorDivInnerHtml(1, pages, selected);
    } else {
        if (selected <= 4) {
            divHtml += createPaginatorDivInnerHtml(1, 5, selected);
            divHtml += _ELLIPSIS_DIV_HTML
            divHtml += createPaginatorDivDefaultPageHtml(pages);
        } else if (selected > (pages - 4)) {
            divHtml += createPaginatorDivDefaultPageHtml(1);
            divHtml += _ELLIPSIS_DIV_HTML;
            divHtml += createPaginatorDivInnerHtml(pages - 4, pages, selected);
        } else {
            divHtml += createPaginatorDivDefaultPageHtml(1);
            divHtml += _ELLIPSIS_DIV_HTML;
            divHtml += createPaginatorDivInnerHtml(selected - 2, selected + 2, selected);
            divHtml += _ELLIPSIS_DIV_HTML;
            divHtml += createPaginatorDivDefaultPageHtml(pages);
        }
    }

    divHtml += _EMPTY_DIV;
    divHtml += "</div></div>";

    return divHtml;
}

function generateRows(selected) {
    var pages = $("#pageCount").val();
    var paginatorDivHtml = createPaginatorDivHtml(pages, selected);

    $("#rawLogTable").after(paginatorDivHtml);
    $(".pagor").click(function () {
        updatePage(this);
    });
}

function updatePage(elem) {
    var selected = $(elem).text();
    var current = $("#page").val();

    if (current == selected) {
        return;
    }

    $("#page").val(selected);
    $("#target").submit();
}