// -*- coding:utf-8-unix -*-

var offset = 180;
var count = 0;
var lastPos = 0;
var afweMode = 0;

function found( flag, results ) {
    if (results.count > 0) {
        browser.find.highlightResults();
    }
    
    if ( flag || count >= results.rectData.length-1 ) {               // flag: button Changed
        count = 0;
    } else {
        count++;
    }
    
    let poses = [];
    for (var i = 0; i < results.rectData.length; i++) {
        poses.push( results.rectData[i].rectsAndTexts.rectList[0].top );
    }
    poses.sort(function(a,b){
        if( a < b ) return -1;
        if( a > b ) return 1;
        return 0;
    });
    
    let top = poses[count];
    while ( lastPos == top || top < offset ) { // 前と同じ位置 または オフセットよりも上
        count++;
        top = poses[count];
    }
    lastPos = top;
    
    browser.tabs.executeScript({
        code: "window.scrollTo( 0, " + ( top - offset ) + " );"
    });
}

function store( toStore, result ) {
    let id = result.shift().id;
    browser.storage.local.remove( [String( id )], function() {} );
    let data = {};
    data[id] = toStore;
    browser.storage.local.set( data, function() {} );
}

function createBtn( result ) {
    let id = result.shift().id;
    browser.storage.local.get( [String( id )], function( item ) {
        let strs = item[String( id )];
        let message = {
            cmd: "createButtons",
            strings: strs
        };
        browser.tabs.sendMessage( id, message, function() {} );
    } );
}


browser.runtime.onMessage.addListener( function( req, sender, response ) {
  if( req.cmd == "find" ){
      browser.find.find( req.toFind, {includeRectData: true} ).then( found.bind( this, req.flag ) );
      return true;
  } else if ( req.cmd == "storeStrs" ) {
      browser.tabs.query( {active: true, currentWindow: true} ).then( store.bind( this, req.toStore ) );
      return true;
  } else if ( req.cmd == "createButtons" ) {
      browser.tabs.query( {active: true, currentWindow: true} ).then( createBtn.bind( this ) );
      return true;
  }
});

// タブを閉じる際に検索文字列も消去する
browser.tabs.onRemoved.addListener( function( tabId, info ) {
    browser.storage.local.remove( [String( tabId )], function() {} );
});
// タブを開く際にも検索文字列を消去する
browser.tabs.onCreated.addListener( function( tabId, info ) {
    browser.storage.local.remove( [String( tabId )], function() {} );
});

// Change to current mode when switched tabs
browser.tabs.onUpdated.addListener( function( tabId, info ) {
    let message = {
        cmd: "changeModeAFWE",
        mode: afweMode
    };
    browser.tabs.sendMessage( tabId, message, function() {} );
});

// Change mode of AFWE
function changeModeAFWE( result ) {
    let id = result.shift().id;
    let message = {
        cmd: "changeModeAFWE",
        mode: afweMode
    };
    browser.tabs.sendMessage( id, message, function() {} );
}

function updateIcon() {
    if ( afweMode == 0 ) {
        browser.browserAction.setTitle({title: "Mode: Mouseover"});
        browser.browserAction.setIcon(
            {
                path: {
                    48: "icons/aftersearchwe_icon_default_48.png",
                    96: "icons/aftersearchwe_icon_default_96.png"
                }
            }
        );
    } else if ( afweMode == 1 ) {
        browser.browserAction.setTitle({title: "Mode: Always Shown"});
        browser.browserAction.setIcon(
            {
                path: {
                    48: "icons/aftersearchwe_icon_green_48.png",
                    96: "icons/aftersearchwe_icon_green_96.png"
                }
            }
        );
    } else if ( afweMode == 2 ) {
        browser.browserAction.setTitle({title: "Mode: Disable"});
        browser.browserAction.setIcon(
            {
                path: {
                    48: "icons/aftersearchwe_icon_red_48.png",
                    96: "icons/aftersearchwe_icon_red_96.png"
                }
            }
        );
    }
}

browser.browserAction.onClicked.addListener( function() {
    if ( afweMode < 2 ) {
        afweMode = afweMode + 1;
    } else {
        afweMode = 0;
    }
    updateIcon();
    browser.tabs.query( {active: true, currentWindow: true} ).then( changeModeAFWE.bind( this ) );
    
});

