const ROOT_FREQUENCY = 55;
const INSTRUMENT_AMOUNT = 3;
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

export {
    ROOT_FREQUENCY,
    INSTRUMENT_AMOUNT,
    SEQUENCE_AMOUNT,
    SEQUENCE_LENGTH,
    DEFAULT_CODE
}