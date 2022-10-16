import mtof from "./helpers/mtof";

const ROOT_FREQUENCY = mtof(72);
const INSTRUMENT_AMOUNT = 4;
const SEQUENCE_AMOUNT = 4;
const SEQUENCE_LENGTH = 16;

const DEFAULT_CODE = `import("stdfaust.lib");
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

const PITCHSHIFTER = `declare name 		"pitchShifter";
declare version 	"1.0";
declare author 		"Grame";
declare license 	"BSD";
declare copyright 	"(c)GRAME 2006";

 //--------------------------------------
 // very simple real time pitch shifter
 //--------------------------------------
 
import("stdfaust.lib");

pitchshifter = vgroup(
                    "Pitch Shifter", 
                    ef.transpose(
                        hslider("window (samples)", 1000, 50, 10000, 1),
                        hslider("xfade (samples)", 10, 1, 10000, 1),
                        hslider("shift (semitones)", 0, -36, +36, 0.1)
                    )
                );

process = pitchshifter;`

export {
    ROOT_FREQUENCY,
    INSTRUMENT_AMOUNT,
    SEQUENCE_AMOUNT,
    SEQUENCE_LENGTH,
    DEFAULT_CODE,
    PITCHSHIFTER
}