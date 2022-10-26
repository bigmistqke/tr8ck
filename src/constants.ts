import mtof from "./utils/mtof";

const ROOT_FREQUENCY = mtof(72);
const INSTRUMENT_AMOUNT = 7;
const TRACK_AMOUNT = 8;
const SEQUENCE_LENGTH = 16;

const DEFAULT_SYNTH = `import("stdfaust.lib");
bubble(f0,trig) = os.osc(f) * (exp(-damp*time) : si.smooth(0.99))
  with {
    damp = 0.043*f0 + 0.0014*f0^(3/2);
    f = f0*(1+sigma*time);
    sigma = eta * damp;
    eta = 0.075;
    time = 0 : (select2(trig>trig'):+(1)) ~ _ : ba.samp2sec;
  };

process = t : g * bubble(hslider("freq", 600, 150, 2000, 1));

g = t,1 : min;
t = button("drop");
`

const DEFAULT_FX = `import("stdfaust.lib");
declare name "new_fx";

process = _,_;`

const PITCHSHIFTER = 
`declare name 		"pitchShifter";
declare version 	"1.0";
declare author 		"Grame";
declare license 	"BSD";
declare copyright 	"(c)GRAME 2006";

 //--------------------------------------
 // very simple real time pitch shifter
 //--------------------------------------
 
import("stdfaust.lib");

pitchshifter = vgroup("Pitch Shifter", 
    ef.transpose(
        hslider("window", 1000, 50, 10000, 1) : si.smoo,
        hslider("xfade", 10, 1, 10000, 1) : si.smoo,
        // best to not change this parameter-name because otherwise pitchshifting and timestretching will not work
        hslider("shift", 0, -72, +72, 0.1)
    )
  );

process = pitchshifter, pitchshifter;`

const REVERB = 
`declare name "freeverb";
declare version "0.0";
declare author "RM";
declare description "Freeverb demo application.";

import("stdfaust.lib");

process = dm.freeverb_demo;`

const FXS = [
`declare name "fuzz";
declare author "Bram de Jong (from musicdsp.org)";
declare version "1.0";

import("music.lib");

dist	= hslider("distortion", 12, 0, 100, 0.1);	// distortion parameter
gain	= hslider("gain", 3, -96, 96, 0.1);		// output gain (dB)

// the waveshaping function
f(a,x)	= x*(abs(x) + a)/(x*x + (a-1)*abs(x) + 1);

// gain correction factor to compensate for distortion
g(a)	= 1/sqrt(a+1);

process	= vgroup("dist", (out, out))
with { out(x) = db2linear(gain)*g(dist)*f(db2linear(dist),x); };`,
  `declare name "freeverb";
declare version "0.0";
declare author "RM";
declare description "Freeverb demo application.";

import("stdfaust.lib");

process = dm.freeverb_demo;`,

`declare name 		"pitchShifter";
declare version 	"1.0";
declare author 		"Grame";
declare license 	"BSD";
declare copyright 	"(c)GRAME 2006";

  //--------------------------------------
  // very simple real time pitch shifter
  //--------------------------------------
  
import("stdfaust.lib");

pitchshifter = vgroup("Pitch Shifter", 
    ef.transpose(
        hslider("window", 1000, 50, 10000, 1) : si.smoo,
        hslider("xfade", 10, 1, 10000, 1) : si.smoo,
        // best to not change this parameter-name because otherwise pitchshifting and timestretching will not work
        hslider("shift", 0, -72, +72, 0.1)
    )
  );

process = pitchshifter, pitchshifter;`,

`declare name 	"smoothDelay";
declare author 	"Yann Orlarey";
declare copyright "Grame";
declare version "1.0";
declare license "STK-4.3";

//--------------------------process----------------------------
//
// 	A stereo smooth delay with a feedback control
//  
//	This example shows how to use sdelay, a delay that doesn't
//  click and doesn't transpose when the delay time is changed
//-------------------------------------------------------------

import("stdfaust.lib");

process = par(i, 2, voice)
	with 
	{ 
		voice 	= (+ : de.sdelay(N, interp, dtime)) ~ *(fback);
		N 		= int(2^19); 
		interp 	= hslider("interpolation[unit:ms][style:knob]",10,1,100,0.1)*ma.SR/1000.0; 
		dtime	= hslider("delay[unit:ms][style:knob]", 0, 0, 5000, 0.1)*ma.SR/1000.0;
		fback 	= hslider("feedback[style:knob]",0,0,100,0.1)/100.0; 
	};`
]


export {
  ROOT_FREQUENCY,
  INSTRUMENT_AMOUNT,
  TRACK_AMOUNT,
  SEQUENCE_LENGTH,
  DEFAULT_SYNTH,
  DEFAULT_FX,
  PITCHSHIFTER,
  REVERB,
  FXS
}