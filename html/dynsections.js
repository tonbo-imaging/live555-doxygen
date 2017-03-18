function toggleVisibility(linkObj)
{
 var base = $(linkObj).attr('id');
 var summary = $('#'+base+'-summary');
 var content = $('#'+base+'-content');
 var trigger = $('#'+base+'-trigger');
 var src=$(trigger).attr('src');
 if (content.is(':visible')===true) {
   content.hide();
   summary.show();
   $(linkObj).addClass('closed').removeClass('opened');
   $(trigger).attr('src',src.substring(0,src.length-8)+'closed.png');
 } else {
   content.show();
   summary.hide();
   $(linkObj).removeClass('closed').addClass('opened');
   $(trigger).attr('src',src.substring(0,src.length-10)+'open.png');
 } 
 return false;
}

function updateStripes()
{
  $('table.directory tr').
       removeClass('even').filter(':visible:even').addClass('even');
}

function toggleLevel(level)
{
  $('table.directory tr').each(function() {
    var l = this.id.split('_').length-1;
    var i = $('#img'+this.id.substring(3));
    var a = $('#arr'+this.id.substring(3));
    if (l<level+1) {
      i.removeClass('iconfopen iconfclosed').addClass('iconfopen');
      a.html('&#9660;');
      $(this).show();
    } else if (l==level+1) {
      i.removeClass('iconfclosed iconfopen').addClass('iconfclosed');
      a.html('&#9658;');
      $(this).show();
    } else {
      $(this).hide();
    }
  });
  updateStripes();
}

function toggleFolder(id)
{
  // the clicked row
  var currentRow = $('#row_'+id);

  // all rows after the clicked row
  var rows = currentRow.nextAll("tr");

  var re = new RegExp('^row_'+id+'\\d+_$', "i"); //only one sub

  // only match elements AFTER this one (can't hide elements before)
  var childRows = rows.filter(function() { return this.id.match(re); });

  // first row is visible we are HIDING
  if (childRows.filter(':first').is(':visible')===true) {
    // replace down arrow by right arrow for current row
    var currentRowSpans = currentRow.find("span");
    currentRowSpans.filter(".iconfopen").removeClass("iconfopen").addClass("iconfclosed");
    currentRowSpans.filter(".arrow").html('&#9658;');
    rows.filter("[id^=row_"+id+"]").hide(); // hide all children
  } else { // we are SHOWING
    // replace right arrow by down arrow for current row
    var currentRowSpans = currentRow.find("span");
    currentRowSpans.filter(".iconfclosed").removeClass("iconfclosed").addClass("iconfopen");
    currentRowSpans.filter(".arrow").html('&#9660;');
    // replace down arrows by right arrows for child rows
    var childRowsSpans = childRows.find("span");
    childRowsSpans.filter(".iconfopen").removeClass("iconfopen").addClass("iconfclosed");
    childRowsSpans.filter(".arrow").html('&#9658;');
    childRows.show(); //show all children
  }
  updateStripes();
}


function toggleInherit(id)
{
  var rows = $('tr.inherit.'+id);
  var img = $('tr.inherit_header.'+id+' img');
  var src = $(img).attr('src');
  if (rows.filter(':first').is(':visible')===true) {
    rows.css('display','none');
    $(img).attr('src',src.substring(0,src.length-8)+'closed.png');
  } else {
    rows.css('display','table-row'); // using show() causes jump in firefox
    $(img).attr('src',src.substring(0,src.length-10)+'open.png');
  }
}

function SearchBox(name, resultsPath, inFrame, label)
{
  this.searchLabel = label;
  this.DOMSearchField = function()
  {  return document.getElementById("MSearchField");  }
  this.DOMSearchBox = function()
  {  return document.getElementById("MSearchBox");  }
  this.OnSearchFieldFocus = function(isActive)
  {
    if (isActive)
    {
      this.DOMSearchBox().className = 'MSearchBoxActive';
      var searchField = this.DOMSearchField();
      if (searchField.value == this.searchLabel)
      {
        searchField.value = '';
      }
    }
    else
    {
      this.DOMSearchBox().className = 'MSearchBoxInactive';
      this.DOMSearchField().value   = this.searchLabel;
    }
  }
}

function trim(s) {
  return s?s.replace(/^\s\s*/, '').replace(/\s\s*$/, ''):'';
}

function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]'+name+
         '='+'([^&;]+?)(&|#|;|$)').exec(location.search)
         ||[,""])[1].replace(/\+/g, '%20'))||null;
}

var entityMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': '&quot;',
  "'": '&#39;',
  "/": '&#x2F;'
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"'\/]/g, function (s) {
    return entityMap[s];
  });
}

function searchFor(query,page,count) {
  $.getJSON(serverUrl+"?cb=?",
  {
    n:count,
    p:page,
    q:query
  },
  function(data) {
    var results = $('#searchresults');
    $('#MSearchField').val(query);
    if (data.hits>0) {
      if (data.hits==1) {
        results.html('<p>'+searchResultsText[1]+'</p>');
      } else {
        results.html('<p>'+searchResultsText[2].replace(/\$num/,data.hits)+'</p>');
      }
      var r='<table>';
      $.each(data.items, function(i,item){
        var prefix = tagMap[item.tag];
        if (prefix) prefix+='/'; else prefix='';
        r+='<tr class="searchresult">'+
           '<td align="right">'+(data.first+i+1)+'.</td>'+
           '<td>'+escapeHtml(item.type)+'&#160;'+
                '<a href="'+escapeHtml(prefix+item.url)+
                '">'+escapeHtml(item.name)+'</a>';
        if (item.type=="source") {
          var l=item.url.match(/[1-9][0-9]*$/);
          if (l) r+=' at line '+parseInt(l[0]);
        }
        r+='</td>';
        for (var i=0;i<item.fragments.length;i++)
        {
          r+='<tr><td></td><td>'+item.fragments[i]+'</td></tr>';
        }
        r+='</tr>';
      });
      r+='</table>';
      if (data.pages>1) // write multi page navigation bar
      {
        r+='<div class="searchpages">';
        if (data.page>0)
        {
          r+='<span class="pages"><a href="javascript:searchFor(\''+escapeHtml(query)+'\','+(page-1).toString()+','+count.toString()+')">&laquo;</a></span>&nbsp;';
        }
        var firstPage = data.page-5;
        var lastPage  = data.page+5;
        if (firstPage<0)
        {
          lastPage-=firstPage;
          firstPage=0;
        }  
        if (lastPage>data.pages)
        {
          lastPage=data.pages;
        }
        for(var i=firstPage;i<lastPage;i++)
        {
          if (i==data.page)
          {
            r+='<span class="pages"><b>'+(i+1).toString()+'</b></span>&nbsp;';
          }
          else
          {
            r+='<span class="pages"><a href="javascript:searchFor(\''+escapeHtml(query)+'\','+i.toString()+','+count.toString()+')">'+(i+1).toString()+'</a></span>&nbsp;';
          }
        }
        if (data.page+1<data.pages)
        {
          r+='<span class="pages"><a href="javascript:searchFor(\''+escapeHtml(query)+'\','+(page+1).toString()+','+count.toString()+')">&raquo;</a></span>';
        }
        r+='</div>';
      }
      results.append(r);
    } else {
      results.html('<p>'+searchResultsText[0]+'</p>');
    }
  });
}

$(document).ready(function() {
  $('.code,.codeRef').each(function() {
    $(this).data('powertip',$('#'+$(this).attr('href').replace(/.*\//,'').replace(/[^a-z_A-Z0-9]/g,'_')).html());
    $(this).powerTip({ placement: 's', smartPlacement: true, mouseOnToPopup: true });
  });
});
