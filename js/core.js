
window.onerror = function(error) {
  alert(error);
}
function tr(string) {
  return i18next.t(string);
}
window.onoffline = function() {
  if (!player.paused) {
    message(tr("Ups! The stream was interrupted due to a sudden disconnect."));
  }
  stopStream();
  updateFinish(nostream);
}
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
var defaultsettings = '{"theme":4,"visualization":false,"relax":false,"relax-timeout":10,"changecolor":false,"volume":100,"transitions":true,"loadpolicy":false,"language":"auto"}',
lists,
settings,
currentstation,
prevdata,
prevvolume,
prevstation,
gearclicked,
hinttimer,
volumetimer,
volumerequest,
slow,
timedout,
relaxtimer,
currentlist,
player = $("video")[0],
appname = $("title").text(),
visible = false,
fetch,
nostream,
listsbackup = {},
listname,
ismousedown = false;
console.log("%c Bine ai venit pe " + appname + "! ", "font-size: 30px; background-color: #ccc; color: #000; font-family: sans-serif");
console.log("%c > spor la modificat :)!_", "font-size: 20px");
console.log("%c\nhttps://github.com/neurici/Online-Radio\n\n", "font-family: sans-serif; font-size: 14px");
console.info("%c" + appname + " este un software gratuid si sunteti bineveniti sa il redistribuiti in anumite conditii; tastati%c learnMore() %cpentru detalii.", "font-size: 14px; font-family: sans-serif", "font-size: 14px", "font-size: 14px; font-family: sans-serif");
function refreshData() {
  var dataobject = {"lists":lists,"settings":settings};
  var data = JSON.stringify(dataobject);
  if (data != localStorage.data) {
    localStorage.data = data;
    console.info("Storage data updated:");
    console.log(JSON.stringify(dataobject, null, 2));
    return true;
  }
  return false;
}
function stationExists(id) {
  var existing = false;
  for (i = 0; i < currentlist.length; i++) {
    if (currentlist[i].id == id) {
      existing = true;
      break;
    } 
  }
  return existing;
}
function refreshResults() {
  $("#query").trigger("input");
  showLoading();
}
function init() {
  $(".name").text(appname);
  $("#query").val(null);
  var hash = location.hash;
  if (hash !== "") {
    switch (hash.substring(1)) {
      case "dialog":
        break;
      default:
        hint("<b>" + tr("Invalid hashtag") + "</b><br><br> " + tr("‘") + hash + tr("’ is unknown."));
    }
    history.replaceState({}, document.title, ".");
  }
  $("#themestyle").attr("href", "css/" + (["pure-dark", "pure", "chic", "chic-dark"][settings.theme - 2] || "pure") + ".css");
  $("#splash").css({
    "background-image": "none",
    "pointer-events": "none",
    opacity: 0
  });
  setTimeout(function() {
    $("#splash").remove();
  }, 2000);
  if (prevcolor == "" || settings.theme != 3) {
    changeColor();
  }
  if (!player.paused) {
    if (settings.visualization) {
      if (vinterval == undefined) {
        visualise();
      }
    }
    else {
      stopV();
    }
    clearTimeout(relaxtimer);
  }
  if (settings.transitions) {
    $("#notransitions").remove();
  }
  else if ($("#notransitions").length == 0) {
    $("head").append("<style id=\"notransitions\">\n  * {\n    transition: none !important;\n  }\n</style>");  
  }
  console.info("Initialization completed");
}
player.onpause = function() {
  stopStream();
  updateFinish(nostream);
}
player.onplay = function() {
  if (player.getAttribute("src") == null) {
    $(".stop:first").trigger("click");
  }
}
function moveArray(arr, oldindex, newindex) {
  if (newindex >= arr.length) {
    var k = newindex - arr.length + 1;
    while (k--) {
      arr.push(undefined);
    }
  }
  arr.splice(newindex, 0, arr.splice(oldindex, 1)[0]);
  return arr;
}
function showLoading() {
  if (requesting) {
    $("#results").empty();
    $("#loadmore").show();
  }
}
function loadSettings() {
  $(".checked").removeClass("checked");
  $("#theme").val(["pure", "puredark", "pure", "chic", "chicdark"][settings.theme - 1]);
  if (settings.changecolor || settings.theme == 3) {
    $("#colorchange").addClass("checked");
  }
  themeSet();
  if (settings.visualization) {
    $("#pseudovsl").addClass("checked");
  }
  if (settings.relax) {
    $("#relaxmode").addClass("checked");
    $("#relaxtimeoutdiv").show();
  }
  else {
    $("#relaxtimeoutdiv").hide();
  }
  $("#relaxtimeout").val(settings["relax-timeout"]);
  $("#defaultvolume").val(settings.volume);
  if (settings.transitions) {
    $("#transitions").addClass("checked");
  }
  if (settings.loadpolicy) {
    $("#loadpolicy").addClass("checked");
  }
  $("#locales").val(settings.language || "auto");
  console.info("Initial values written into settings dialog");
}
function themeSet() {
  $("#descriptions > span").hide();
  $("#" + $("#theme").val()).show();
}
function saveSettings() {      
  switch ($("#theme").val()) {
    case "puredark":
      settings.theme = 2;
      break;
    case "chic":
      settings.theme = 4;
      break;
    case "chicdark":
      settings.theme = 5;
      break;
    default:
      settings.theme = 1;
  }
  settings.visualization = $("#pseudovsl").hasClass("checked");
  settings.relax = $("#relaxmode").hasClass("checked");
  settings["relax-timeout"] = +$("#relaxtimeout").val();
  settings.changecolor = $("#colorchange").hasClass("checked");
  settings.volume = +$("#defaultvolume").val();
  settings.transitions = $("#transitions").hasClass("checked");
  settings.loadpolicy = $("#loadpolicy").hasClass("checked");
  settings.language = $("#locales").val();
  if (settings.language != tr("en") && (!detected || settings.language != "auto")) {
    if (player.paused) {
      $(document).off("scroll");
      $("html").html("<h1 style=\"font-family: Roboto, sans-serif\">" + tr("Asteptati un moment…") + "</h1>"); 
      stopStream();
      location.reload();
    }
    else {
      hint("<i class=\"fa fa-info-circle\"></i> " + tr("Trebuie sa reincarcati pagina pentru ca toate modificarile sa aiba efect."));
    }
  }
  if (settings.language != "auto") {
    $("#locales [value=auto]").text(tr("Detectare"));
    detected = false;
  }
  stationUpdate(false);
  refreshData();
  init();
}
$("title").text(appname);
function showVolume(plus) {
  var newvol = player.volume;
  if (plus) {
    newvol += .1;
  }
  else {
    newvol -= .1;
  }
  if (newvol > 1) {
    newvol = 1;
  }
  else if (newvol < 0) {
    newvol = 0;
  }
  player.volume = newvol.toFixed(1);
  var rvolume = player.volume * 100;
  hint("<i style='font-size: 60px' class='fa fa-volume-" + ((rvolume > 0) ? "up" : "off") + "'></i><div style='font-size: 25px'>" + ((rvolume > 0) ? rvolume + "%" : tr("Mut")) + "</div>", true);
}
function restoreStation() {
  stationUpdate(true);
}
var secondinterval;
function undelete(message, backup, mod, func, listname) {
  clearInterval(secondinterval);
  $("#progressbar").css({
    width: 0,
    transition: "none"
  });
  $("#restoretext").text(message);
  $("#footer").css({
    top: "calc(100% - " + $("#footer").height() + "px)",
    visibility: "visible"
  });
  var i = 0;
  var secondfunction = function() {
    i += 10;
    $("#progressbar").css({
      width: i + "%",
      transition: ""
    });
    if (i == 110) {
      clearInterval(secondinterval);
      $("#footer").css({
        top: "100%",
        visibility: "hidden"
      });
    }
  };
  secondfunction();
  secondinterval = setInterval(secondfunction, 1000);
  $("#restore").off("click");
  $("#restore").on("click", function() {
    if (mod != "list") {
      window[mod] = backup.slice();
    }
    else {
      lists = JSON.parse(backup);
    }
    func();
    $("#footer").css({
      top: "100%",
      visibility: "hidden"
    });    
  });
}
function learnMore() {
  modal("learnmore");
  return $("#infotext").text().replace(/          /g, "\n").trim();
}
function hint(text, square, confirm) {
  clearTimeout(hinttimer);
  $("#navbar, .videobar").css({
    opacity: .5
  });    
  $("#hint").css({
    opacity: 1,
    visibility: "visible"
  });
  if (text != "load") {
    $("#hint > div").html(text);
  }
  else if ($("#hint .fa-spinner").length == 0) {
    $("#hint > div").html("<i style='font-size: 60px; margin: 16px 0' class='fa fa-spinner fa-spin'></i>");
  }
  var timems = 5000;
  if (confirm) {
    $("#hint > div").append("<div style='text-align: right'><a onclick='closeHint()' class='button'>" + tr("OK") + "</a></div>")
  }
  else if (text != "load") {
    hinttimer = setTimeout(function() {
      closeHint();
    }, timems);      
  }
  if (square || text == "load") {
    $("#hint > div").css({
      "width": "100px"
    });
    timems = 2000;
  }
  else {
    $("#hint > div").css({
      "width": "300px"
    });
  }
  $("#hint > div").css({
    transform: "scale(1, 1)"
  });
}
function closeHint() {
  $("#navbar, .videobar").css({
    opacity: 1
  });    
  $("#hint").css({
    opacity: 0,
    visibility: "hidden"
  });
  $("#hint > div").css({
    transform: "scale(1, .5)"
  });
}
function message(text) {
  hint(text, false, true);
}
function browseCrb() {
  var items = ["countries", "states", "languages"];
  for (i = 0; i < items.length; i++) (function(item) {
    var current = $("[data-type=" + item + "]");
    if (current.parent().prop("disabled")) {
      $.post("https://www.radio-browser.info/webservice/json/" + item, function(data) {
        var options = "<option value=''>" + tr("All ") + tr(item) + "</option>";
        for (i in data) {
          options += "<option value='" + data[i].name + "'>" + data[i].name + "</option>";
        }
        current.html(options).parent().prop("disabled", false);
      }).fail(function() {
        current.html("<option value=\"\">" + tr("Cerere nereusita") + "</option>");
        $("#failmsg").slideDown();
      });
    }
  })(items[i]);
}
function updateFinish(newstation) {
  if (prevdata != newstation) {
    if (newstation == nostream) {
      $('title').html(appname);
      changeColor();
      stopV();
      wakeUp();
    }
    else {
      $('title').html(newstation + " – " + appname);
      currentstation = newstation;
      changeColor();
      if (vinterval == undefined) {
        visualise();
      }
      if (prevdata == nostream && settings.relax) {
        clearTimeout(relaxtimer);
        relaxtimer = setTimeout(function() {
          relax(); 
        }, settings["relax-timeout"] * 1000);
      }
    }
    $(".station").css({
      opacity: 0
    });
    setTimeout(function() {
      $(".station, #relaxcaption span").html(newstation).css({
        opacity: 1
      });
    }, 400);
    prevdata = newstation;
  }
}
function setPlaying(station) {
  $("#stations .playbutton > i").addClass("fa-play").removeClass("fa-stop");
  $("#stations > tr").removeClass("playing");
  if (station) {
    for (i in currentlist) {
      if (JSON.stringify(currentlist[i]) == JSON.stringify(station)) {
        $("#stations .playbutton:eq(" + i + ") > i").addClass("fa-stop").removeClass("fa-play");
        $("#stations > tr:eq(" + i + ")").addClass("playing");
      }
    }
  }
}
var hls = new Hls();
var errormessage;
hls.on(Hls.Events.MANIFEST_PARSED, function() {
  closeHint();
  player.play();
});
hls.on(Hls.Events.ERROR, function(_, data) {
  stopStream();
  updateFinish(nostream);
  message(tr("Scuze, a aparut o eroare. ") + ((Hls.isSupported()) ? ((data.details != "levelLoadTimeOut") ? errormessage + " → HLS fallback → " + data.details : tr("Timeout: conexiunea la retea pare a fi prea lenta in acest moment.")) : tr("Fluxul poate necesita un protocol precum HLS, care nu pare sa fie acceptat de browserul dvs..")));
});
var hasvideo;
function startStream(index) {
  stopStream();
  $("body").css({
    scrollTop: 0
  });
  setPlaying(index);
  player.ontimeupdate = function() {
    if (hasvideo != (player.videoHeight > 0)) {
      hasvideo = (player.videoHeight > 0);
      if (player.videoHeight > 0) {
        $("#vcontain").show();
        $(".fullscreen").show();
        $(document).trigger("scroll");
        wakeUp();
      }
      else {
        $("#vcontain").hide();
      }
    }
  }
  player.onloadedmetadata = function() {
    updateFinish(index.name);
    toggle(true);
    prevstation = index;
    $("#external").attr("href", index.url);
    $("#external").show();
    console.info("Started streaming '" + index.name + "'");
  }
  player.onwaiting = function() {
    hint("load");
  }
  player.oncanplay = function() {
    closeHint();
  }
  player.load();
  var play = function(url) {
    if (navigator.onLine) {
      if (url.endsWith(".m3u8")) {
        hint("load");
        hls.loadSource((location.protocol == "https:") ? url.replace("http:", "https:") : url);
        hls.attachMedia(player);
      }
      else {
        player.setAttribute("src", url);
        player.play().catch(function(e) {
          errormessage = e.message;
          stopStream();
          if (e.name == "NotAllowedError") {
            message(tr("Gestul utilizatorului pare să fie necesar. Click pe ‘") + index.name + tr("’ pentru a porni fluxul audio."));
          }
          else if (url != index.url) {
            play(index.url);
            setPlaying(index);
          }
          else {
            message(tr("Scuze, a aparut o eroare. ") + errormessage);
          }
        });
      }
    }
    else {
      stopStream();
      message(tr("Asigurati-va ca sunteti conectat la internet."));
    }
  };
  if (index.id) {
    $.post("https://www.radio-browser.info/webservice/v2/json/url/" + index.id, function(data) {
      play(data.url);
    }).fail(function() {
      play(index.url);
    });
  }
  else {
    play(index.url);
  }
  hint("load");
}
function stopStream() {
  $("#vcontain").hide();
  $(".fullscreen").hide();
  $(document).trigger("scroll");
  hasvideo = false;
  if ($(".fullscreen i").hasClass("fa-compress")) {
    $(".fullscreen").trigger("click");
  }
  hls.detachMedia();
  hls.stopLoad();
  if ($(".stop").children().hasClass("fa-stop")) {
    console.info("Stopped streaming");
  }
  setPlaying(null);
  toggle(false);
  if ($("#hint").find(".fa-spinner").length) {
    closeHint();
  }
  player.onerror = null;
  player.removeAttribute("src")
  player.load();
  stopV();
}
function stationUpdate(save) {
    if (save) {
      sync(true);
    }
    $("#stations").empty();
    for (i = 0; i < currentlist.length; i++) {
      var content = "<tr><td style='vertical-align: middle'><div><div class='playbutton' onclick='if ($(this).children().hasClass(\"fa-play\")) { startStream(currentlist[" + i + "]); } else { $(\".stop:first\").trigger(\"click\") }'><i style='display: table-cell; vertical-align: middle' class='fa fa-fw fa-play'></i></div>" + "<div class='icontain'><img class='icon' src='" + ((settings.loadpolicy) ? currentlist[i].icon : "") + "' onerror='$(this).replaceWith(\"<div class=\\\"icon\\\" style=\\\"background: hsl(" + currentlist[i].name.toUpperCase().charCodeAt(0) * 20 + ", 50%, 50%)\\\"><span>" + currentlist[i].name[0].toUpperCase() + "</span></div>\")'>" + "</div></div></td><td><div style='display: block; padding-bottom: 20px; cursor: pointer' onclick='$(this).closest(\"tr\").find(\".playbutton\").trigger(\"click\")'><div><h4 style='font-weight: 500; display: inline'>" + currentlist[i].name + "</h4></div></div><div style='position: relative; overflow: hidden; height: 30px'><div style='position: absolute; overflow-x: scroll; overflow-y: hidden; width: 100%' class='tags'><div style='white-space: nowrap; height: 30px'><span class='label'>" + currentlist[i].country + "</span> <span class='label'>" + currentlist[i].state + "</span> ";
      for (z = 0; z < currentlist[i].tags.split(",").length; z++) {
        content += "<span class='label'>" + currentlist[i].tags.split(",")[z].trim() + "</span> ";
      }
      content += "</div></div></div></div></td><td style='padding-right: 15px'><select class='smartmenu' title='" + tr("Options for ‘") + currentlist[i].name + tr("’") + "'><option selected hidden value='icon'>&#xf142;&nbsp;</option><optgroup label='" + tr("Optiuni pentru ‘") + currentlist[i].name + tr("’") + "'><option value='homepage'>" + tr("Vizitare Pagina Web") + "</option><option value='edit'>" + tr("Editare") + "</option>" + ((i > 0) ? "<option value='moveup'>" + tr("Muta mai sus in lista") + "</option>" : "") + ((i < currentlist.length - 1) ? "<option value='movedown'>" + tr("Muta mai jos in lista") + "</option>" : "") + "<option value='delete'>" + tr("Stergere") + "</option></optgroup><option>" + tr("Anulare") + "</option></select></td></tr>";
      $("#stations").append(content);
    }
    if (!player.paused) {
      setPlaying(prevstation);
    }
    if (currentlist.length != 0) {
      $("#zero").hide();
      $("#stations").show();
    }
    else {
      $("#zero").show();
    }
}
function sync(save) {
  var stations = JSON.parse(localStorage.data || defaultdata).lists;
  if (currentlist != stations) {
    if (save) {
      //SAVE
      lists[listname] = currentlist;
      refreshData();
    }
    else {
      //LOAD
      currentlist = stations[listname] || [];
      lists[listname] = currentlist;
      stationUpdate(false);
    }
  }
}
function validStation() {
  return !!($("[placeholder='Name']").val() && $("[placeholder='URL']").val());
}
function addCustomStation() {
  currentlist.push({});
  $("#customstations input").val("");
  gearclicked = currentlist.length - 1;
  modal("stationmanager");
}
function setList(name) {
  $("#lists").val(name);
  if (listname != name) {
    listname = name;
    sync(false);  
  }
}
function addList() {
  if ($("[data-item=\"\"]").length == 0) {
    appendList("");
  }
  $("div[data-item=\"\"] > input").attr("placeholder", tr("Specificati un nume")).select();
  var yposition = $("div[data-item=\"\"]").offset().top + $("#modals").scrollTop() - $("body").scrollTop();
  $("#modals").animate({
    scrollTop: yposition
  });
}
function removeList(name) {
  var listbackup = JSON.stringify(lists);
  delete lists[name];
  applyLists();
  if (name == listname) {
    setList($("#lists > optgroup > option").html());
  }
  undelete(tr("Lista de redare ‘") + name + tr("’ a fost stersa."), listbackup, "list", applyLists, name);
}
function renameList(oldname) {
  $("div[data-item=\"" + oldname + "\"] > .itemname").focus();
}
function applyLists() {
  refreshData();
  $("#listdiv").empty();
  $("#lists > optgroup").empty();
  for (var list in lists) {
    $("#lists > optgroup").append("<option>" + list + "</option>");
    appendList(list);
  }
  $("#lists").val(listname);
}
var bartimer;
function showVideoBar() {
  clearTimeout(bartimer);
  $(".videobar, .stationdiv").finish().show();
  $("#video").css({
    cursor: "auto"
  });
  if (player.videoHeight > 0 && $("#video").hasClass("fs")) {
    bartimer = setTimeout(function() {
      $(".videobar, .stationdiv").fadeOut();
      $("#video").css({
        cursor: "none"
      });
    }, 3000);
  }
}
function refreshTags(tagstring) {
  $("#preview").empty();
  if (tagstring.trim()) {
    var tags = tagstring.split(",");
    for (i in tags) {
      $("#preview").append("<span class='label'>" + tags[i].trim() + "</span> ");
    }
    $("#tagview").show();
  }
  else {
    $("#tagview").hide();
  }
}
function appendList(name) {
  var input = document.createElement("input");
  input.setAttribute("class", "itemname");
  input.setAttribute("placeholder", tr("Noul nume"));
  input.setAttribute("value", name);
  var div = document.createElement("div");
  div.setAttribute("data-item", name);
  div.setAttribute("style", "display: table-row");
  div.innerHTML = input.outerHTML + "<div style='display: table-cell; white-space: nowrap'><a class='renamelist' onclick='renameList($(this).closest(\"[data-item]\").data(\"item\"))'><i class='fa fa-fw fa-edit'></i></a><a class='okay' style='display: none'><i class='fa fa-fw fa-check'></i></a>" + ((name != "" && Object.keys(lists).length > 1) ? "<a onclick='removeList($(this).closest(\"[data-item]\").data(\"item\"))'><i class='fa fa-fw fa-trash'></i></a>" : "") + "</div>";
  $("#listdiv").append(div);
}
var searching = false;
function loadEntries() {
  requesting = true;
  fetch = $.post("https://www.radio-browser.info/webservice/json/stations/search", {
    name: stationsearched,
    offset: offset,
    limit: 20,
    country: $("#country").val(),
    state: $("#state").val(),
    language: $("#language").val(),
    order: $("#order").val(),
    reverse: ($("#order").prop("selectedIndex") < 5) ? $("#reverse").hasClass("checked") : !$("#reverse").hasClass("checked")
  }, function(data) {  
    $("#failure").hide();
    requesting = false;
    var sum = 0;
    var results = "";
    var icons = [null, "flag", "map-marker", "comment-alt fa-flip-horizontal", "file-audio", "play", "thumbs-up"];
    for (i = 0; i < data.length; i++) {
      if ($("#showbroken").hasClass("checked") || data[i].lastcheckok == "1") {
        var available = true;
        for (z in currentlist) {
          if (currentlist[z].id == data[i].id) {
            available = false;
            break;
          }
        }
        results += "<div style='cursor: pointer; display: table; table-layout: fixed; width: 100%" + ((available) ? "" : "; opacity: .5; cursor: not-allowed' title='" + tr("This station has already been added to ‘") + listname + tr("’.")) + "' data-meta='" + JSON.stringify(data[i]).replace(/'/g, "&apos;") + "' class='result'><div class='checkmark green' style='display: table-cell; opacity: 0; width: 0'><i class='fa fa-check' style='margin-left: 10px'></i></div><div style='padding: 10px; margin-bottom: 10px; display: table-cell'><h4 style='margin: 0'>" + ((available) ? "" : "<i class='fa fa-ban red'></i> ") + data[i].name + "</h4><br>" + ((data[i].lastcheckok == 0) ? "<span class='label red' style='font-weight: 500'>" + tr("BROKEN") + "</span> " : "") + (($("#order").prop("selectedIndex") > 0) ? "<span class='label green' style='font-weight: 500'><i class='fa fa-" + icons[$("#order").prop("selectedIndex")] + "'></i> " + (data[i][$("#order").val()] || "<i class='fa fa-question'></i>") + "</span> " : "") + ((+data[i].hls) ? "<span class='label'>HLS</span> " : ((+data[i].bitrate) ? "<span class='label'>" + data[i].bitrate + " kBit/s</span> " : "")) + (($("#order").prop("selectedIndex") != 1) ? "<span class='label'>" + data[i].country + "</span> " : "") + (($("#order").prop("selectedIndex") != 2) ? "<span class='label'>" + data[i].state + "</span> " : "");
        if (data[i].tags != "") { 
          for (z = 0; z < data[i].tags.split(",").length; z++) {
            results += "<span class='label'>" + data[i].tags.split(",")[z].trim() + "</span> ";
          }
        }
        else {
          results += "<br>";
        }
        results += "</div></div>";
      }
      else {
        console.warn("'" + data[i].name + "' [" + (i + offset) + "] seems to be BROKEN.");
      }
      sum++;
    }
    if (offset == 0) {
      $("#results").empty();
      $("#loadmore").show();
    }
    $("#results").append(results);
    if (sum < 20) {
      searching = false;
      $("#loadmore").hide();
      if ($("#results > div").length == 0) {
        $("#results").html("<p style='font-size: 18px; text-align: center'><i class='far fa-fw fa-meh'></i>" + tr("Nu am gasit nici un post radio care sa corespunda cu cererea dvs..") + "</p>");
      }
    }
    else {
      searching = true;
    }
    clearInterval(closetimer);
    $("#results").show();
    console.info("Got " + $("#results > div").length + " results.");
    $("#modals").trigger("scroll");
  }).fail(function(event) {
    if (event.statusText != "abort") {
      searching = false;
      requesting = false;
      $("#loadmore").hide();
      $("#results").hide();
      $("#failure").show();
    }
  });
}
var offset = 0;
var stationsearched;
function findStation(name) {
  offset = 0;
  stationsearched = name.trim().replace(/\s+/g, " ");
  $("#loadmore").show();
  loadEntries();
}
var prevcolor;
function changeColor() {
  var color = ((settings.changecolor || settings.theme == 3) && !player.paused) ? "hsl(" + currentstation.toUpperCase().charCodeAt(0) * 20 + ", 50%, 60%)" : "";
  if (color != prevcolor) {
    prevcolor = color;
    $("body").css({
      background: color.replace("60%", "30%")
    });
    $("body")[0].style.setProperty("--themecolor", color);
    console.info("Style color set");
  }
}
var relaxed = false;
function relax() {
  if (!player.paused && location.hash != "#dialog" && settings.relax && player.videoHeight == 0) {
    relaxed = true;
    if (vinterval == undefined) {
      visualise();
    }
    $("body").addClass("relaxed").css({
      background: "hsl(" + currentstation.toUpperCase().charCodeAt(0) * 20 + ", 50%, 30%)"
    });
    console.info("Entered relax mode");
  }
}
function wakeUp() {
  if (relaxed) {
    relaxed = false;
    if (!settings.visualization) {
      stopV();
    }
    $("body").removeClass("relaxed");
    if (!settings.changecolor && settings.theme != 3) {
      $("body").css({
        background: ""
      });
    }
    console.info("Left relax mode");
  }
}
function modal(id) {
  if (id != "hint") {
    $("#modals").css({
      transform: "scale(1)",
      opacity: 1,
      visibility: "visible",
      "pointer-events": "auto"
    });
    $("body").css({
      overflow: "hidden"
    });
  }
  if (id == "addstation") {
    browseCrb();
    $("#query").trigger("input");
    $("#loadmore").show();
    setTimeout(function() {
      $("#query").select();
    }, 100);
  }
  else if (id == "stationmanager") {
    refreshTags(currentlist[gearclicked].tags || "");
  }
  $("#modals").scrollTop(0);
  $("#" + id).show().addClass("shown");
  $("#modals > div:not(#" + id + ")").hide();
  if (id != "hint") {
    history.pushState(null, null, "#dialog");
  }
  wakeUp();
  console.info("Dialog with tag ID " + id + " shown");
}
var closetimer;
function closeModal() {
  if ($(".shown").attr("id") == "listmanager") {
    applyLists();
  }
  else if ($(".shown").attr("id") == "stationmanager") {
    $("#customstations input").trigger("blur");
    if (validStation()) {
      stationUpdate(true);
    }
    else {
      hint("<i class='fa fa-exclamation-triangle'></i> " + tr("Salvarea a esuat: datele statiei radio sunt gresite"));
    }
  }
  $("#modals").css({
    transform: "scale(1.1)",
    opacity: 0,
    visibility: "hidden",
    "pointer-events": "none"
  });
  $("body").css({
    overflow: "auto"
  });
  if (location.hash == "#dialog") {
    history.back();
    $(window).trigger("mousemove");
  }
  if ($(".shown").has("#addstation")) {
    $("#addfooter").css({
      top: "100%",
      visibility: "hidden"
    });  
    $("#modals").css({
      height: "100%"
    });  
    closetimer = setTimeout(function() {
      $("#query").val("");
      $("#results").hide();
    }, 400);
  }
  $(".shown").removeClass("shown");
  clearTimeout(relaxtimer);
  if (settings.relax) {
    relaxtimer = setTimeout(function() {
      relax(); 
    }, settings["relax-timeout"] * 1000);
  }
  console.info("Dialog hidden");
}
var vinterval;
function visualise() {
  if (settings.visualization || relaxed) {
    vinterval = setInterval(function() {
      $("#visualization").children().each(function() {
        $(this).css({
          top: Math.random() * 15 + 50 + "%"
        });
      });
    }, 100);
    $("#visualization").show();
    console.info("Pseudo-visualization shown");
  }
}
function stopV() {
  if (vinterval != undefined) {
    clearInterval(vinterval);
    vinterval = undefined;
    $("#visualization").children().css({
      top: "100%" 
    });
    $("#visualization").hide()
    console.info("Pseudo-visualization hidden");
  }
}
function toggle(on) {
  var icon = $(".stop").children();
  if (on) {
    icon
      .removeClass("fa-play")
      .addClass("fa-stop");
  }
  else {
    icon
      .removeClass("fa-stop")
      .addClass("fa-play");
  }
}
var languages = [];
try {
  settings = JSON.parse(localStorage.data || "{\"settings\":" + defaultsettings + "}").settings;
}
catch (e) {
  settings = JSON.parse(defaultsettings);
}
var prevlanguage = settings.language || "auto"
var language = prevlanguage;
if (language == "auto") {
  language = navigator.language.substring(0, 2);
  if (navigator.languages != undefined) {
    languages = navigator.languages.slice();
    $.each(languages, function(i, item) {
      languages[i] = item.substring(0, 2);
    });
    languages = Array.from(new Set(languages.slice(0, (languages.includes("en")) ? languages.indexOf("en") : Infinity)));
  }  
}
var detected = false;
i18next
  .use(i18nextXHRBackend)
  .init({
    lng: (language != "en") ? language : null,
    fallbackLng: languages,
    nsSeparator: null,
    keySeparator: null,
    backend: {
      loadPath: "locales/{{lng}}.json"
    }
  }, function() {
    $("[tr]").each(function() {
      $(this).html(tr($(this).html()));
    });
    $("[title]").each(function() {
      $(this).attr("title", tr($(this).attr("title")));
    });
    $("[label]").each(function() {
      $(this).attr("label", tr($(this).attr("label")));
    });
    $("[placeholder]").each(function() {
      $(this).attr("placeholder", tr($(this).attr("placeholder")));
    });
    defaultdata = "{\"lists\":{\"" + tr("Favorites") + "\":[]},\"settings\":" + defaultsettings + "}";
    try {
      lists = JSON.parse(localStorage.data || defaultdata).lists;
    }
    catch (e) {
      lists = JSON.parse(defaultdata).lists;
    }
    try {localStorage}
    catch (e) {
      $("noscript")[0].outerHTML = $("noscript").text();
      $("#initfail h1").text(tr("Activati spatiul de stocare offline!"));
      $("#initfail p").text(tr("Stocarea offline este utilizata pentru a va asigura ca datele aplicatiei (de exemplu, statiile radio si setarile) nu se vor pierde. Aceasta pagină nu colecteaza date personale. Partile terte (radiodifuzorii) ar putea actiona diferit."));
    }
    if (navigator.userAgent.indexOf("Trident") != -1 && !localStorage.try) {
      $("noscript")[0].outerHTML = $("noscript").text();
      $("#initfail h1").text(tr("Pot fi posibile probleme de compatibilitate"));
      $("#initfail p").html(tr("Internet Explorer nu accepta unele dintre functionalitatile de baza pe care se bazeaza aceasta aplicatie web.") + " <a href=\"#\" onclick=\"localStorage.try = '1'; location = location.href\">" + tr("Incercati oricum (poate sa nu functioneze)") + "</a>");
    }
    listname = Object.keys(lists)[0];
    loadSettings();
    $("html").attr("lang", tr("en"));
    if (settings.language == "auto") {
      $("#locales [value=auto]").append(" (" + tr("en") + ")");
      detected = true;
    }
    nostream = tr("Sistemul este operational");
    console.info("Locale strings loaded");
    updateFinish(nostream);
    init();
    $("select:has([data-type])").prop("disabled", true);
    applyLists();
    player.volume = settings.volume / 100;
    sync(false);
    $("#relaxcaption").css({
      "font-size": Math.sqrt($(window).width() * 1.2) + "pt"
    });    
    function param(param) {
      if (param = (new RegExp("[?&]" + encodeURIComponent(param) + "=([^&]*)")).exec(location.search)) {
        return decodeURIComponent(param[1]);
      }
    }
    var source = param("src");
    var id = param("id");
    var keepoff = param("keepoff");
    var query = param("q");
    history.pushState(null, null, ".");
    function autoStart() {
      if (!keepoff || keepoff == false) {
        for (i in currentlist) {
          if (currentlist[i].id == id) {
            startStream(currentlist[i]);
          }
        }
      }
    }
    if (source) {
      setList(tr("Added via ") + source);
      if (id) {
        if (!stationExists(id)) {
          $.post("https://www.radio-browser.info/webservice/json/stations/byid/" + id, function(data) {
            if (!lists[tr("Added via ") + source]) {
              lists[tr("Added via ") + source] = [];
            }
            applyLists();
            currentlist.push({"name":data[0].name,"url":data[0].url,"homepage":data[0].homepage,"icon":data[0].favicon,"country":data[0].country,"state":data[0].state,"language":data[0].language,"tags":data[0].tags,"id":data[0].id});
            stationUpdate(true);
            autoStart();
          }).fail(function() {
            message(tr("Ne pare rău, postul nu a putut fi adăugat prin ") + source + tr(" deoarece o solicitare a esuat."));
          });
        }
        else {
          autoStart();
        }
      }
      else if (query) {
        applyLists();
        setTimeout(function() {
          $("#query").val(query);
          modal("addstation");
        }, 0);
      }
    }
    $("#hidefooter").on("click", function() {
      $("#footer").css({
        top: "100%",
        visibility: "hidden"
      });
    });
    $("#chremove").on("click", function() {
      currentlist.splice(gearclicked, 1);
      stationUpdate(true);
      closeModal();
    });
    $("body").on("keydown", function(event) {
      if (event.which == 32 && location.hash != "#dialog") {
        event.preventDefault();
      }
    });
    var typing = false;
    var typetimer;
    $("body").on("keyup", function(event) {
      var key = event.key;
      if (!(location.hash == "#dialog" || event.ctrlKey || event.altKey || event.shiftKey || event.metaKey)) {
        switch (key) {
          case "-":
            showVolume(false);
            break;
          case "+":
            showVolume(true);
            break;
          case " ":
            if (!$(".stop").hasClass("disabled")) {
              if (!$(".stop").children().hasClass("fa-play")) {
                hint("<i style='font-size: 60px; margin: 16px 0' class='fa fa-stop'></i>", true);
              }
              $(".stop:first").trigger("click");
            }
            break;
          case "f":
            if ($(".fullscreen").css("display") != "none") {
              $(".fullscreen").trigger("click");
            }
            else {
              hint("<i class='fa fa-exclamation-triangle'></i> " + tr("Nu exista flux video"));
            }
            break;
          case "p":
            $(".prevstation:first").trigger("click");
            break;
          case "n":
            $(".nextstation:first").trigger("click");
            break;
          default:
            if (!isNaN(key)) {
              clearTimeout(typetimer);
              typetimer = setTimeout(function() {
                var digit = $("#hint span").html().replace(/–/g, "");
                typing = false;
                if (digit <= currentlist.length && digit > 0) {
                  closeHint();
                  startStream(currentlist[digit - 1]);
                }
                else {
                  hint("<i class='fa fa-fw fa-exclamation-triangle'></i> " + tr("Statia ") + +digit + tr(" nu exista."));
                }
              }, 2000);
              if (!typing || !$("#hint span").html().match(/–/g)) {
                typing = true;
                var output = "";
                for (var i = 0; i < currentlist.length.toString().length - 1; i++){
                  output += "–";
                }
                hint("<span style='font-size: 32px'>" + key + output + "</span>", true, false);
              }
              else {
                $("#hint span").html($("#hint span").html().replace("–", key));
              }
            }
        }
      }
      if (location.hash == "#dialog" && key == "Escape") {
        history.back();
      }
    });
    $("[placeholder='" + tr("Tags") + "']").on("input", function() {
      refreshTags($(this).val());
    });
    $("#customstations input").on("blur", function() {
      if (validStation()) {
        currentlist[gearclicked].name     = $("[placeholder='" + tr("Name")     + "']").val();
        currentlist[gearclicked].url      = $("[placeholder='" + tr("URL")      + "']").val();
        currentlist[gearclicked].homepage = $("[placeholder='" + tr("Homepage") + "']").val();
        currentlist[gearclicked].icon     = $("[placeholder='" + tr("Icon")     + "']").val();
        currentlist[gearclicked].country  = $("[placeholder='" + tr("Country")  + "']").val();
        currentlist[gearclicked].state    = $("[placeholder='" + tr("State")    + "']").val();
        currentlist[gearclicked].language = $("[placeholder='" + tr("Sprache")  + "']").val();
        currentlist[gearclicked].tags     = $("[placeholder='" + tr("Tags")     + "']").val();
        sync(true);
      }
    });
    $("#done").on("click", function() {
      closeModal();
    });
    $("#wrench").on("click", function() {
      modal("listmanager");
    });
    $("#closesettings").on("click", function() {
      $('#discardsettings').trigger('click');
    });
    $(".stop").on("click", function() {
      var icon = $(this).children();
      if (icon.hasClass("fa-stop")) {
        stopStream();
        updateFinish(nostream);
      }
      else {
        if (prevstation != undefined) {
          startStream(prevstation);
        }
        else if (currentlist.length > 0) {
          startStream(currentlist[0]);
        }
        else {
          hint("<i class='fa fa-fw fa-exclamation-triangle'></i>" + tr("Adaugati mai intai o statie radio in lista de redare."));
        }
      }
    });
    $(".prevstation").on("click", function() {
      if (currentlist.length > 1) {
        var index = currentlist.indexOf(prevstation);
        if (index > 0) {
          startStream(currentlist[index - 1]);
        }
        else if (index >= 0) {
          startStream(currentlist[currentlist.length - 1]);
        }
      }
    });
    $(".nextstation").on("click", function() {
      if (currentlist.length > 1) {
        var index = currentlist.indexOf(prevstation);
        if (index >= 0 && index < currentlist.length - 1) {
          startStream(currentlist[index + 1]);
        }
        else if (index >= 0) {
          startStream(currentlist[0]);
        }
      }
    });
    $("#external").on("click", function() {
      stopStream();
    });
    $("#vcontain").on("dblclick", function() {
      $(".fullscreen").trigger("click");
    });
    $("#video").on("mousedown mouseup mousemove", function() {
      showVideoBar();
    });
    $("#tryfetch").on("click", function() {
// //       $("#failmsg").slideUp();
      browseCrb();
    });
    $("#redoajax").on("click", function() {
      loadEntries();
      showLoading();
      $("#failure").hide();
    });
    $(".minus").on("click", function() {
        showVolume(false);
    });
    $(".plus").on("click", function() {
        showVolume(true);
    });
    $(".fullscreen").on("click", function() {
      var video = $("#video")[0];
      if ($(".fullscreen i").hasClass("fa-expand")) {
        if (video.requestFullscreen) {
          video.requestFullscreen();
        }
        else if (video.msRequestFullscreen) {
          video.msRequestFullscreen();
        }
        else if (video.mozRequestFullScreen) {
          video.mozRequestFullScreen();
        }
        else if (video.webkitRequestFullscreen) {
          video.webkitRequestFullscreen();
        }
      }
      else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
        else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
        else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        }
        else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
        $("#video").removeClass("fs")
        console.info("Left fullscreen");
      }
    });
    $("video").on("contextmenu", function() {
      return false;
    });
    function fullscreenChange() {
      if (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement) {
        $(".fullscreen i").removeClass("fa-expand").addClass("fa-compress");
        $("#video").addClass("fs");
        $("#hint").prependTo("#video");
        console.info("Entered fullscreen");
      }
      else {
        $(".fullscreen i").removeClass("fa-compress").addClass("fa-expand");
        $("#video").removeClass("fs");
        $("#hint").insertAfter("#modals");
        clearTimeout(bartimer);
        console.info("Left fullscreen");
      }
      showVideoBar();
      $(document).trigger("scroll");
    }
    $(document).on("fullscreenchange", fullscreenChange).on("webkitfullscreenchange", fullscreenChange).on("mozfullscreenchange", fullscreenChange);
    $(window).on("hashchange", function() {
        if (location.hash === "" && $(".shown").length == 1) {
          closeModal();
        }
    }).on("dragstart", function() {
        return false;
    }).on("mousemove mousedown keydown touchstart", function() {
      if (settings.relax) {
        clearTimeout(relaxtimer);
        wakeUp();
        relaxtimer = setTimeout(function() {
            relax(); 
        }, settings["relax-timeout"] * 1000);
      }
    }).on("resize", function() {
        $("#relaxcaption").css({
          "font-size": Math.sqrt($(window).width() * 1.2) + "pt"
        });
        if (relaxed) {
          relax();
        }
        if ($("#footer").css("visibility") == "visible") {
          $("#footer").css({
            top: "calc(100% - " + $("#footer").height() + "px)"
          });
        }
        if ($("#addfooter").css("visibility") == "visible") {
          $("#addfooter").css({
            top: "calc(100% - " + $("#addfooter").height() + "px)"
          });
        }
        $(document).trigger("scroll");
    });
    $("#findstation").on("click", function() {
      if (searching) {
        showLoading();
        $("#modals").finish().animate({
          scrollTop: $("#query").offset().top - $(window).scrollTop() + $("#modals").scrollTop()
        });
      }
    });
    $("#country").on("change", function() {
      $("#state").val("");
      refreshResults();
      $.post("https://www.radio-browser.info/webservice/json/states", {
        country: $("#country").val()
      }, function(data) {
        var options = "<option value=''>" + tr("All ") + tr("states") + "</option>";
        for (i in data) {
          options += "<option value='" + data[i].name + "'>" + data[i].name + "</option>";
        }
        $("[data-type=states]").html(options);
      }).fail(function() {
        $("[data-type=states]").html("<option value=\"\">" + tr("Cerere nereusita") + "</option>");
        $("#failmsg").slideDown();
      });
    });
    $("#addstation select:not(#country)").on("change", refreshResults);
    $("#moreoptions a").on("click", function() {
      if ($("#filters").css("display") == "none") {
        $("#filters").stop().slideDown();
        $("#moreoptions span").text(tr("Ascundere optiuni cautare"));
        $("#moreoptions i").css({
          transform: "rotate(-180deg)"
        });
      }
      else {
        $("#filters").stop().slideUp();
        $("#moreoptions span").text(tr("Afisare optiuni cautare"));
        $("#moreoptions i").css({
          transform: "rotate(0deg)"
        });
      }
    });
    $("#query")
      .on("keyup", function(event) {
          if (event.which == 13) {
              $("#findstation").trigger("click");
              $("#query").blur();
          }
      }).on("input", function() {
        if (fetch != undefined && "abort" in fetch) {
          fetch.abort();
        }
        findStation($("input").val());
        $("#findstation").removeClass("disabled");
        $(".selected").trigger("click");
        $("#loadmore").hide();
      }).on("focus", function() {
        $(this).parent().css({
          background: "rgba(0, 0, 0, .1)"
        });
      }).on("blur", function() {
        showLoading();
        $(this).parent().css({
          background: ""
        });
      });
    $("form").on("submit", function(event) {
        event.preventDefault();
    });
    $("#addlist").on("click", addList);
    $("#modals, .closer").on("click", function() {
      closeModal();
    });
    $("#modals > div").on("click", function(event) {
      event.stopPropagation();
    });
    $(".addbutton").on("click", function() {
      modal("addstation");
    });
    $("#settingsbutton").on("click", function() {
      modal("settings");
    });
    $("#learnmorebutton").on("click", function() {
      modal("learnmore");
    });
    $("#applysettings").on("click", function() {
      var valid = true;
      $("input[type=number]").each(function() {
        var value = Number($(this).val())
        if (valid && ($(this).attr("min") > value || $(this).attr("max") < value || Math.floor(value) != value || $(this).val() == "")) {
          valid = false;
        }
      });
      if (valid) {
        saveSettings();
        closeModal();
      }
      else {
        message(tr("A fost detectata cel putin o intrare nevalida."));
      }
    });
    $("#discardsettings").on("click", function() {
      settings = JSON.parse(localStorage.data || defaultdata).settings;
      loadSettings();
      closeModal();
    });
    $("#reset").on("click", function() {
      settings = JSON.parse(defaultsettings);
      loadSettings();
      saveSettings();
    });
    $(".checkable").on("click", function() {
      if ($(this).hasClass("checked")) {
        $(this).removeClass("checked");
        if ($(this).attr("id") == "relaxmode") {
          $("#relaxtimeoutdiv").hide();
        }            
      }
      else {
        $(this).addClass("checked");
        if ($(this).attr("id") == "relaxmode") {
          $("#relaxtimeoutdiv").show();
        }
      }
      if ($(this).is("#reverse") || $(this).is("#showbroken")) {
        refreshResults();
      }
      if ($(this).css("opacity") == .5) {
        hint("<i class='fa fa-exclamation-triangle'></i> " + tr("Ecranul si/sau fereastra nu este destul de larg/a") + ".");
      }
    }).on("select", function() {
      return false;
    });
    $("#listdl").on("change", function() {
      if ($(this).val() != "cancel") {
        var output;
        var type;
        switch ($(this).val()) {
          case "m3u":
            output = "#EXTM3U\n";
            type = "audio/mpegurl";
            currentlist.forEach(function(item) {
              output += "#EXTINF:-1," + item.name + "\n" + item.url + "\n";
            });
            break;
          case "pls":
            output = "[playlist]\n";
            type = "audio/x-scpls";
            currentlist.forEach(function(item, index) {
              output += "File" + ++index + "=" + item.url + "\nTitle" + index + "=" + item.name + "\n";
            });
            output += "Version=2\n";
            break;
          case "xspf":
            output = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<playlist version=\"1\" xmlns=\"http://xspf.org/ns/0/\">\n  <trackList>\n";
            type = "application/xspf+xml";
            currentlist.forEach(function(item, index) {
              output += "    <track>\n      <title>" + item.name + "</title>\n      <location>" + item.url + "</location>\n    </track>\n";
            });
            output += "  </trackList>\n</playlist>\n";
        }  
        $("#blob").attr("href", URL.createObjectURL(new Blob([output], {type: type})));
        $("#blob").attr("download", listname.replace(/ /g, "_") + "_" + (new Date).getTime() + "." + $(this).val());
        $("#blob")[0].click();
      }
      $(this).val("icon");
    });
    $("input[type=file]").on("change", function(event) {
      var file = event.target.files[0];
      var reader = new FileReader;
      reader.readAsText(file);
      reader.onload = function(event) {
        settings = JSON.parse(event.target.result);
        loadSettings();
        saveSettings();
        hint(tr("Importarea a fost efectuata cu succes."));
      }
      reader.onerror = function() {
        message(tr("Eroare la citirea fisierului."));
      }
      $(this).val("");
    });
    $("#import").on("click", function() {
      $("input[type=file]").trigger("click");
    });
    $("#export").on("click", function() {
      saveSettings();
      $("#blob").attr("href", URL.createObjectURL(new Blob([JSON.stringify(settings)], {type: "application/json"})));
      $("#blob").attr("download", "Settings_" + (new Date).getTime() + ".json");
      $("#blob")[0].click();
    });
    $(".minus, .plus").on("DOMMouseScroll", function(event) {
      event.preventDefault();
      showVolume(event.originalEvent.detail < 0);
    }).on("mousewheel", function(event) {
      event.preventDefault();
      showVolume(event.originalEvent.wheelDelta > 0);
    });  
    $("#theme").on("change", themeSet);
    var clicked = false, clickY, scrollleft, tagdiv;
    $(document).on("mousedown", ".tags", function(e) {
      clicked = true;
      clickY = e.pageX;
      scrollleft = $(this).scrollLeft();
      tagdiv = $(this);
      $("html").addClass("dragging");
    }).on("mousemove", function(e) {
        if (clicked) {
          tagdiv.scrollLeft(scrollleft + clickY - e.pageX);
        }
    }).on("mouseup", function() {
      clicked = false;
    });
    $(document).on("scroll", function(event) {
      if ($("#video .videobar").offset().top - $(window).scrollTop() <= 50 && !$("#video").hasClass("fs")) {
        $("body").addClass("fixedplayer");
      }
      else {
        $("body").removeClass("fixedplayer");
      }
    });
    $(document).trigger("scroll");
    $("#modals").on("scroll", function() {
      if (searching && $("#addstation").hasClass("shown") && $("#loadmore").offset().top - $(window).height() - $(window).scrollTop() < 0) {
        searching = false;
        offset += 20;
        loadEntries();
      }
    });
    $("#lists").on("change", function() {
      if ($(this).prop("selectedIndex") == $("#lists > optgroup > option").length) {
        setList(listname);
        modal("listmanager");
        $("#listul").empty();
        for (var key in lists) {
          $("#listul").append("<li>" + key + "</li>");
        }
      }
      else {
        setList($(this).val());      
      }
    });
    $(document).on("mousedown", ".smartmenu, .tags", function() {
      dragging = false;
      $("#tomove").hide();   
      $("#stations td:nth-child(2) > div:nth-child(1)").css({
        cursor: "pointer"
      });
    }).on("change", ".smartmenu", function() {
      gearclicked = $(this).index("#stations .smartmenu");
      switch ($(this).val()) {
        case "homepage":
          open(currentlist[gearclicked].homepage, "_blank");
          break;
        case "edit":
          modal("stationmanager");
          $("#stationname").text(currentlist[gearclicked].name);
          $("#customstations").show();
          $("[placeholder='" + tr("Name")     + "']").val(currentlist[gearclicked].name);
          $("[placeholder='" + tr("URL")      + "']").val(currentlist[gearclicked].url);
          $("[placeholder='" + tr("Homepage") + "']").val(currentlist[gearclicked].homepage);
          $("[placeholder='" + tr("Icon")     + "']").val(currentlist[gearclicked].icon);
          $("[placeholder='" + tr("Country")  + "']").val(currentlist[gearclicked].country);
          $("[placeholder='" + tr("State")    + "']").val(currentlist[gearclicked].state);
          $("[placeholder='" + tr("Language") + "']").val(currentlist[gearclicked].language);
          $("[placeholder='" + tr("Tags")     + "']").val(currentlist[gearclicked].tags);        
          break;
        case "moveup":
          moveArray(currentlist, gearclicked, gearclicked - 1);
          stationUpdate(true);
          break;
        case "movedown":
          moveArray(currentlist, gearclicked, gearclicked + 1);
          stationUpdate(true);
          break;
        case "delete":
          var stationbackup = currentlist.slice();
          var victim = currentlist[gearclicked].name;
          currentlist.splice(gearclicked, 1);
          stationUpdate(true);    
          undelete(tr("Statia radio ‘") + victim + tr("’ a fost stearsa."), stationbackup, "currentlist", restoreStation);          
      }
      $(this).val("icon");
    });
    $("#addchecked").on("click", function() {
      $(".selected").each(function(index) {
        var meta = $(this).data("meta");
        currentlist.push({"name":meta.name,"url":meta.url,"homepage":meta.homepage,"icon":meta.favicon,"country":meta.country,"state":meta.state,"language":meta.language,"tags":meta.tags,"id":meta.id});
      });
      stationUpdate(true);
      closeModal();
    });
    $(document).on("blur", ".itemname", function() {
      $(this).next().find(".okay").hide();
      $(this).next().find(".renamelist").show();
      var item = $(this);
      var oldname = $(this).closest("[data-item]").data("item");
      var name = item.val().trim().replace(/\s+/g, " ") || null;
      if (oldname != name) {
        if (lists[name] == undefined) {
          if (name) {
            if (lists[oldname]) {
              lists[name] = lists[oldname].slice();
              delete lists[oldname];
            }
            else {
              lists[name] = [];
              hint(tr("Lista ‘") + name + tr("’ a fost creeata"));
            }
            if ($("#lists").val() == oldname) {
              listname = name;
            }
            applyLists();      
          }
          else {
            hint(tr("Nume nevalid"));   
            applyLists();
          }
        }
        else {
          hint(tr("Deja exista"));
          applyLists();
        }
      }
    }).on("focus", ".itemname", function() {
      $(this).next().find(".okay").show();
      $(this).next().find(".renamelist").hide();
      $(this).select();      
    }).on("keydown", "div[data-item] > .itemname", function(event) {
      if (event.which == 13) {
        event.preventDefault();
        $(this).blur();
      }
    });
    $("#customstations input").on("keydown", function(event) {
      if (event.which == 13) {
        $(this).blur();
      }
    });
    $("#listtools").on("mouseenter", function() {
      $(this).css({
        opacity: 1
      });
    }).on("mouseleave", function() {
      $(this).css({
        opacity: .5
      });
    });
    $("#deselectall").on("click", function() {
      $(".selected").trigger("click");
    });
    $("#results").on("click", ".result", function() {
      if ($(this).hasClass("selected")) {
        $(this).removeClass("selected");
        if ($(".selected").length == 0) {
          $("#addfooter").css({
            top: "100%",
            visibility: "hidden"
          });    
        }
        $(this).children().first().css({
          width: 0,
          opacity: 0
        });
      }
      else if (!stationExists($(this).data("meta").id)) {
        $(this).addClass("selected");
        $("#addfooter").css({
          top: "calc(100% - " + $("#addfooter").height() + "px)",
          visibility: "visible"
        });  
        $(this).children().first().css({
          width: "25px",
          opacity: 1
        });
      }
      else {
        message(tr("‘") + $(this).data("meta").name + tr("’ a fost deja adauga in lista de redare: ‘") + listname + tr("’."));
      }
      if ($(".selected").length != 1) {
        $("#stationcount").html($(".selected").length + tr(" stations"));      
      }
      else {
        $("#stationcount").html(tr("‘") + $(".selected").data("meta").name + tr("’"));      
      }
      if ($(".selected").length > 0) {
        var topheight = "calc(100% - " + $("#addfooter").height() + "px)";
        $("#addfooter").css({
          top: topheight
        });
        $("#modals").css({
          height: topheight
        });      
      }
      else {
        $("#modals").css({
          height: "100%"
        });  
      }
    });
    var dragging = false;
    var dragindex;
    var row;
    var cursor;
    $("#stations").on("mousedown", "tr", function(e) {
      dragging = true;
      dragindex = $(this).index();
      row = $(this);
      $("#tomove").html(row[0].outerHTML.replace(/id=/g, ""));
      cursor = e.pageY;
      $("#tomove").css({
        height: row.height(),
        width: row.width(),
        left: row.offset().left,
        top: row.offset().top - $(window).scrollTop()
      });
    });
    var moveinterval;
    $(document).on("mousemove", function(e) {
      if (dragging) {
        $("html").addClass("dragging");
        $("#tomove").show();
        $("#tomove").css({
          top: row.offset().top + e.pageY - cursor - $(window).scrollTop()
        });
        clearInterval(moveinterval);
        moveinterval = undefined;
        if ($("#tomove").css("display") != "none") {
          var position = $("#tomove").position().top;
          if (position <= 50) {
            moveinterval = setInterval(function() {
              $(window).scrollTop($(window).scrollTop() - 20);
            }, 10);
          }
          else if ($(window).height() - position - $("#tomove").height() <= 0) {
            moveinterval = setInterval(function() {
              $(window).scrollTop($(window).scrollTop() + 20);
            }, 10);
          }
        }
      }
    }).on("mouseup", function() {
      $("html").removeClass("dragging");
      if (dragging) {
        dragging = false;
        clearInterval(moveinterval);
        moveinterval = undefined;
        $("#tomove").hide();
        $("#tomove").empty();
        var newindex = $("#stations tr:hover").index();
        if (newindex != -1 && newindex != dragindex) {
          moveArray(currentlist, dragindex, newindex);
          stationUpdate(true);
        }
        $("#stations td:nth-child(2) > div:nth-child(1)").css({
          cursor: "pointer"
        });        
      }
    });
});
