const noteMap : {[key: string]: number} = {};
const midiMap : string[] = [];
const notes = [ "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B" ];

for(let i = 0; i < 127; i++) {

  let key = notes[i % 12];
  const octave = ((i / 12) | 0) - 1;

  if(key.length === 1) {
    key = key + '-';
  }

  key += octave;

  noteMap[key] = i;
  midiMap[i] = key;
}

export default (midi: number) => midiMap[midi]