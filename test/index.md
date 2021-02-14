
 <!DOCTYPE html>
 <html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en-gb" lang="en" xmlns:og="http://opengraphprotocol.org/schema/" xmlns:fb="http://www.facebook.com/2008/fbml" itemscope itemtype="http://schema.org/Map">
     <head>
         <title>KI-% Open access</title>
         <meta name="robots" content="noindex">
         <meta charset="utf-8" />
 		 <!-- Get url from file !-->
         <script src="/test/urlConfig.js" type="text/javascript" language="javascript"></script>
		 
  		<!-- Get packages -->
  		<script>
  		function loadError(oError) {
  		  throw new URIError("The script " + oError.target.src + " did not load correctly.");
  		}
  		function affixScriptToHead(url, onloadFunction) {
  		  var newScript = document.createElement("script");
  		  newScript.onerror = loadError;
  		  if (onloadFunction) { newScript.onload = onloadFunction; }
  		  document.head.appendChild(newScript);
  		  newScript.src = url;
  		  newScript.type = "text/javascript";
  		}
  		affixScriptToHead(urlPackages + "sigma/sigma.min.js", function() {
  		  affixScriptToHead(urlPackages + "sigma/sigma.parseJson.js", function() {
  			affixScriptToHead(urlPackages + "jquery/jquery.min.js", function() {
  			  affixScriptToHead(urlPackages + "main.js");
  			});
  		  });
  		});
  		
  	    function affixStyleToHead(url, onloadFunction) {
  		  var newStyle = document.createElement("link");
  		  newStyle.onerror = loadError;
  		  if (onloadFunction) { newStyle.onload = onloadFunction; }
  		  document.head.appendChild(newStyle);
  		  newStyle.rel  = "stylesheet";
  		  newStyle.type = "text/css";
            newStyle.media = "screen";
  		  newStyle.href = url;
  		}
  		affixStyleToHead(urlPackages + "css/style.css");
  		</script>

 		<style>
 			p.disclaimer_bold {
 			 font-weight: bold; font-size: 60%;
 			}
 			p.disclaimer {
 			 font-size: 60%;
 			}
 			div.leftPane {
 			  width:20%;
 			  padding: 1%;
 			  overflow: scroll;
 			  height: 600px;
 			  max-height: 90%;
 			}
 		    div.leftPaneContent {
 			  max-width:100%;
 			  padding: 1%;
 			}
 		    div.searchbox {
 			  max-width:100%;
 			  padding: 1%;
 		  }
 			#sigma-canvas {background-color:#ffffff}
 		</style>
   <!-- Matomo -->
   <script type="text/javascript">
    var _paq = window._paq || [];
    /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);
    (function() {
    var u="https://analytics.kib.ki.se/";
    _paq.push(['setTrackerUrl', u+'matomo.php']);
    _paq.push(['setSiteId', '4']);
    var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
    g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
    })();
   </script>
   <!-- End Matomo Code -->
     </head>
     <body>
         <div class="sigma-parent">
             <div class="sigma-expand" id="sigma-canvas"></div>
         </div>
 
         <div id="mainpanel" class="leftPane">
             <div class="leftPaneContent">
                 <div id="title"></div>
                 <div id="titletext"></div>
                 <div id="legend">
                     <div class="box">
                         <h2>Legend:</h2>
                         <dl>
                             <dt class="node"></dt>
                             <dd></dd>
                             <dt class="edge"></dt>
                             <dd></dd>
                             <dt class="colours"></dt>
                             <dd></dd>
                         </dl>
                     </div>
                 </div>
 				<div class="b1">
                     <form>
                         <div id="search" class="searchbox"><h2>Search:</h2>
                             <input type="text" name="search" value="Search in labels" class="empty"/><div class="state"></div>
                             <div class="results"></div>
                         </div>
                     </form>
                 </div>
 				<div class="leftPaneContent" >
 				    </br>
 					<p>Updated: 2021-01-29</p></br>
 					<p>Created by the bibliometric group at Karolinska Institutet university library: (Fereshteh Didegah, Robert Juhasz, Catharina Rehn, Peter Sjögårde). Contact: kib@ki.se</p></br>
 					<p class="disclaimer_bold">Disclaimers:</p>
             </div>
             </div>
         </div>
 
         <div id="zoom">
             <div class="z" rel="in"></div>
             <div class="z" rel="out"></div>
             <div class="z" rel="center"></div>
         </div>
 
         <div id="attributepane">
             <div class="text">
 
 
                 <div title="Close" class="left-close returntext">
                     <div class="c cf"><span>Return to the full network</span></div>
                 </div>
 

                 <div class="nodeattributes">
                     <div class="name"></div>
                     <div class="data"></div>
                 </div>
 
             </div>
         </div>
     </body>
 </html>
