## TR8CK (if you know a better name please make an issue and tell me)

an experimental DAW/tracker with [`Faust`](https://faust.grame.fr/) live coding via [`faust2webaudio`](https://github.com/grame-cncm/faust2webaudio) and UI powered by [`SolidJS`](https://www.solidjs.com/)

https://user-images.githubusercontent.com/10504064/220413126-94eee963-d698-4bbc-8058-e18a1c2e3e0a.mp4

# create patterns
https://user-images.githubusercontent.com/10504064/220414816-88cefef8-b7ee-436d-845d-12e939bb32c6.mp4

# form compositions from patterns
https://user-images.githubusercontent.com/10504064/220415497-a61fff7a-7cda-400c-a2ea-7ea2e74cf5bd.mp4

# upload and edit samples
https://user-images.githubusercontent.com/10504064/220416542-024aa939-0372-4723-a464-aec7f15d078b.mp4

# write/edit your own synths in the Faust programming language
https://user-images.githubusercontent.com/10504064/220416957-18c35628-d6ba-4745-82ac-101fc8e680b0.mp4

# write/edit your own fx in the Faust programming language
https://user-images.githubusercontent.com/10504064/220417215-2faa7eb9-7a98-43c5-9a20-f662cee657eb.mp4

# CAPABILITIES:

- [x] pattern-view
- [x] composition-view
  - [x] compose a sequence of patterns
  - [x] group patterns together
  - [x] loop groups
  - [x] copy/paste groups
- [x] synths with Faust
  - [x] compile custom Faust dsp-code
  - [x] editable parameters
- [x] sampler
  - [x] wave visualizer and selector
  - [x] timestretch
  - [x] reverse
  - [x] record from mic
  - [x] resample from set
- [x] fx with Faust
  - [x] drag'n'drop fx into track or instrument's fx chain
  - [x] edit and recompile Faust code fx
- [x] code-editor for Faust (CodeMirror6)
  - [x] synthax-highlighting and completions
  - [x] error handling
- [x] save set
- [x] record live / render set

🚧 still under construction, but if you want to go ahead and play around with it, please do! 🚧
🚧 currently unable to be build/deployed due to how `faust2webaudio` links to the wasm-file! 🚧

