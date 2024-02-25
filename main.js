import tab_util from "./util/tab_util.js";
window.tab_util = tab_util;

import dataLoader from "./util/dataloader.js";
new p5(dataLoader, "dataloader");

import radialSketch from "./vis/radial-2.js";
import histogram from "./vis/histogram.js";
import focus from "./vis/focus.js";

setTimeout(
	() => { if(document.getElementById("radial")) new p5(radialSketch, "radial") },
	500
)

if(document.getElementById("focus")) new p5(focus, "focus");

if(document.getElementById("histogram"))
setTimeout(
	() => new p5(histogram, "histogram"),	//	Needed because of DataLoader
	1000										//	Ugly but IDK what to do about it
);

