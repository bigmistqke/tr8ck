import deepClone from "deep-clone";
import Faust2WebAudio, { Faust, FaustAudioWorkletNode } from "faust2webaudio";
import { TCompiledDsp } from "faust2webaudio/src/types";
import {
  getHex
} from "pastel-color";
import { batch, createEffect, untrack } from "solid-js";
import { createStore, produce, StoreSetter } from "solid-js/store";
import zeptoid from "zeptoid";

import { FXS, INSTRUMENT_AMOUNT, ROOT_FREQUENCY, SEQUENCE_LENGTH, TRACK_AMOUNT } from "./constants";
import collectParameters from "./faust/collectParameters";

import { DSPElement, FaustElement, FaustFactory, FxParameter, Instrument, Note, Pattern, Sampler, Track, Waveform, WebAudioElement } from "./types";
import ARRAY from "./utils/ARRAY";
import bpmToMs from "./utils/bpmToMs";
import copyArrayBuffer from "./utils/copyArrayBuffer";
import ftom from "./utils/ftom";
import getLocalPosition from "./utils/getLocalPosition";
import Initialized from "./utils/Initialized";
import AudioNodeRecorder from "./utils/webaudio/AudioNodeRecorder";
import cloneAudioBuffer from "./utils/webaudio/cloneAudioBuffer";
import { getWebAudioMediaStream } from "./utils/webaudio/getWebAudioMediaStream";
import StreamRecorder from "./utils/webaudio/StreamRecorder";
import MediaStreamRecorder from "./utils/webaudio/StreamRecorder";
import arrayBufferToWaveform from "./waveform/arrayBufferToWaveform";
import audioBufferToWaveform from "./waveform/audioBufferToWaveform";



const initSequence = () : Note[] => 
  Array(SEQUENCE_LENGTH)
    .fill(0)
    .map(() => ({
      active: false
    }))

const initSequences = () => 
  Array(TRACK_AMOUNT)
    .fill(0)
    .map(initSequence)

const initPattern = () : Pattern => ({
  id: "first",
  color: getHex(),
  sequences: initSequences()
})

const [store, setStore] = createStore<{
  faust?: Faust
  context?: AudioContext
  clock: number
  clockOffset: number
  bpm: number
  playMode: "pattern" | "composition"
  rootNode?: AudioNode
  audioRecorder?: {
    recorder: AudioNodeRecorder
    type: "mic" | "file" | "resample"
  }
  patterns: Pattern[]
  tracks: Track[]
  composition: ({id: string, patternId: string})[]
  faustFactories: FaustFactory[]
  instruments: (Instrument)[]
  editors: {
    id: string
    code: string
    oncompile: (dsp: TCompiledDsp) => void
  }[]
  selection: {
    frequency: number
    instrumentIndex: number
    patternId: string
    blockId?: string
    trackIndex: number
  }
  keys: {
    shift: boolean
    control: boolean
    alt: boolean
  }
  dragging: {
    fx: {
      id: string
      name: string
      detachable: boolean
      parameters?: any[]
      active?: boolean
    } | undefined
  }
  bools: {
    playing: boolean
  }
  audioBuffers: {arrayBuffer: ArrayBuffer, name: string}[]
  mic?: MediaStream
}>({
  clock: -1,
  faust: undefined,
  context: new window.AudioContext(),
  playMode: "pattern",
  clockOffset: 0,
  bpm: 120,
  rootNode: undefined,
  audioRecorder: undefined,
  patterns: [initPattern()],
  composition: [],
  tracks: Array(TRACK_AMOUNT).fill(0).map(()=>({
    instrument: undefined,
    semitones: 0,
    frequency: 0,
    fxChain: [],
    compilingIds: []
  })),
  instruments: Array(INSTRUMENT_AMOUNT)
    .fill(0)
    .map((_,i) =>
      ({
        active: true,
        index: i,
        type: "synth",
        code: "",
        node: undefined,
        color: "",
        pan: 0,
        fxChains: [[]],
        speed: 1,
        compilingIds: [],
        nothings: []
      })
  ),
  editors: [],
  selection: {
    frequency: ROOT_FREQUENCY,
    instrumentIndex: 0,
    patternId: "first",
    blockId: undefined,
    trackIndex: 0
  },
  keys: {
    shift: false,
    control: false,
    alt: false
  },
  faustFactories: [],
  dragging: {
    fx: undefined
  },
  bools: {
    playing: true
  },
  audioBuffers: [],
  mic: undefined
})


const initContext = () => {
  const context = new window.AudioContext()
  let rootNode = new GainNode(context);

  setStore("context", context)
  setStore("rootNode", rootNode)
}

const initFaust = async () => {
  const faust = new Faust({
    wasmLocation: "node_modules/faust2webaudio/dist/libfaust-wasm.wasm",
    dataLocation: "node_modules/faust2webaudio/dist/libfaust-wasm.data",
  })
  await faust.ready
  setStore("faust", faust)
}

const initKeyboard = () => {
  window.onkeydown = (e) => {
    console.log(e.code);
    switch(e.code){
      case "ShiftLeft":
      case "ShiftRight":
        setStore("keys", "shift", true);
        break;
      case "AltLeft":
      case "AlttRight":
        setStore("keys", "alt", true);
        break;
      case "ControlLeft":
      case "ControlRight":
        setStore("keys", "control", true);
        break;
      case "Space":
        e.preventDefault();
        togglePlaying();
        break;
      case "KeyR":
        if(store.keys.shift)
          actions.recordAudio(false)
        if(store.keys.alt)
          actions.recordAudio(true)
        break;
    }
  }
  window.onkeyup = (e) => {
    switch(e.code){
      case "ShiftLeft":
      case "ShiftRight":
        setStore("keys", "shift", false);
        break;
      case "AltLeft":
      case "AlttRight":
        setStore("keys", "alt", false);
        break;
      case "ControlLeft":
      case "ControlRight":
        setStore("keys", "control", false);
        break; 
    }
  }
}


const initClock = function(){
  setStore("clockOffset", performance.now())
  let spb;

  const run = () => {
    if(!store.bools.playing) return
    requestAnimationFrame(run);
    spb = 1000 / (store.bpm / 60 * 4)
    const c = Math.floor((performance.now() - store.clockOffset) / bpmToMs(store.bpm));
    if(c > store.clock){
      setStore("clock", c);
      renderAudio();
    }
  }

  createEffect(()=>{
    if(store.bools.playing)
      untrack(run)
  })
}

const setPlayMode = (playMode: "pattern" | "composition") => setStore("playMode", playMode)

const compileFaust = (code: string) => {
  try{
    return store.faust?.compileCodes(code, ["-I", "libraries/"], true)
  }catch(err){
    console.error("code can not comipe: ", code, err)
  }}
const createFactory = (dsp: TCompiledDsp) => {
  const f = {
    dsp: Object.setPrototypeOf(dsp, {}),
    name: () => f.dsp.dspMeta.name,
    parameters: [],
    id: zeptoid()
  }

  const [factory, setFactory] = createStore<FaustFactory>(f)

  createEffect(()=>{
    const dsp = factory.dsp;
    setFactory("parameters", collectParameters(dsp))
  })  

  return factory
}
const addToFaustFactories = (fx: FaustFactory) => setStore("faustFactories", (faustFactories) => [...faustFactories, fx])

const updateFaustFactory = (id: string, dsp: TCompiledDsp) => {
  setStore("faustFactories", (factory) => factory.id === id, "dsp", Object.setPrototypeOf(dsp, {}))
}


/* const compileFaust = async (code: string, name: string) =>  {

  const compiledDsp = await store.faust?.compileCodes(code, ["-I", "libraries/"], true);

  if(!compiledDsp) return;

  const fx = {
    dsp: Object.setPrototypeOf(compiledDsp, {}),
    name,
    parameters: collectParameters(compiledDsp)
  }

  setStore("faustFactories", (faustFactories) => [...faustFactories, fx])

  return compiledDsp;
} */

const createFaustNode = async (dsp: TCompiledDsp) : Promise<Faust2WebAudio.FaustAudioWorkletNode | undefined>=> {
  if(!store.faust || !store.context) return undefined
  const optionsIn = { compiledDsp: dsp, audioCtx: store.context, args: { "-I": "libraries/" }};

  // TODO: this is some hacky way to not get errors when i create multiple nodes from the same factory
  // probably best to look into faust2webaudio and improve the code
  dsp.shaKey += zeptoid();

  const node = await store.faust.getAudioWorkletNode(optionsIn);
  return node;
}

const setSelectedInstrumentIndex = (index: number) => setStore("selection", "instrumentIndex", index)
const getSelectedInstrument = () => store.instruments[store.selection.instrumentIndex]


const initFx = async () => {
  setStore("faustFactories", []);
  const defaultFxs = await Promise.all(FXS.map(code => compileFaust(code)))
  defaultFxs.forEach(dsp => {
    if(!dsp) return;
    addToFaustFactories(createFactory(dsp));
  })
}

const createNothing = async () => {
  const factory = store.faustFactories.find(factory => factory.name() === "nothing")
  if(!factory) return;
  const element =  await createFaustElementFromFaustFactory({
    factory,
    id: zeptoid(),
    active: true
  })
  return element
}

const createNothings = async () => {
  const nothing1 = await createNothing();
  const nothing2 = await createNothing();
  return [nothing1, nothing2]
}


const initTracks = async () => {
  batch(()=> {
    store.rootNode!.connect(store.context!.destination);
    const pitchshifterFactory = store.faustFactories.find(fx => fx.dsp.dspMeta.name === "pitchShifter");

    if(!pitchshifterFactory) return;  
    store.tracks.forEach(async (track, index) => {
      const pitchshifter = await createNodeAndAddToFxChainTrack({
        factory: pitchshifterFactory, 
        id: "pitchshifter", 
        trackIndex: index,
        detachable: false,
        active: true
      }, 0, false)
      if(!pitchshifter || !store.context) return;
      const [input, output] = createPorts();
      setStore("tracks", index, "fxChain", (chain) => [output, ...chain, input]);
      setStore("tracks", index, "pitchshifter", pitchshifter.node);
      updateFxChain(track.fxChain, store.rootNode)

    })
  })
}

const defaultSampler = (index: number = store.instruments.length) : Sampler => ({
  active: true,
  index,
  type: "sampler",
  navigation: {
    start: 0,
    end: 0,
  },
  selection: {
    start: 0,
    end: 0
  },        
  src: undefined,
  waveform: undefined,
  color: getHex(),
  fxChains: new Array(store.tracks.length).fill(0).map(() => []),
  nothings: [],
  speed: 1,
  inverted: false,
  compilingIds: [],
  pan: 0
})


const initInstruments = async () => {

  const nothing = store.faustFactories.find(factory => factory.name() === "nothing")
  if(!nothing){
    console.error("could not find nothing");
    return 
  }

  if(!store.context) return;
  for(let i = 0; i < INSTRUMENT_AMOUNT; i++){
 

    setStore("instruments", i, defaultSampler())

/*     batch(() => {
      store.tracks.forEach(async (_, index) => {
        const [nothing1, nothing2] = await createNothings()
        if(!nothing1 || !nothing2) return
        setStore("instruments", i, "fxChains", index, [nothing1, nothing2])
        updateFxChain(store.instruments[i].fxChains[index])
      })
    }) */

    batch(() => {
      store.tracks.forEach((_, index) => {
        const [input, output] = createPorts()
        if(!input || !output) return
        setStore("instruments", i, "fxChains", index, [output, input])
        updateFxChain(store.instruments[i].fxChains[index])
      })
    })
  }
}


const createGain = () : DSPElement => {
  return {
    id: zeptoid(),
    name: () => "gain",
    detachable: false,
    node: new GainNode(store.context!),
    connection: undefined,
    active: true
  }
}

const createGains = () => [createGain(), createGain()]
const createPorts = () => {
  const [input, output] = createGains();
  input.name = () => "input"
  output.name = () => "output"
  return [input, output]
}



const setBPM = (bpm: StoreSetter<number, ["bpm"]>, offset: number) => {
  batch(()=>{
    setStore("bpm", bpm)
    const clockOffset = (store.clock) * bpmToMs(store.bpm)
    setStore("clockOffset", performance.now() - clockOffset);
  })
} 

const toggleTypeSelectedInstrument = () => {
  const instrument = getSelectedInstrument()
  if(!instrument.active) return;
  const instrumentType = instrument.type === "synth" ? "sampler" : "synth"
  setStore("instruments", store.selection.instrumentIndex, "type", instrumentType)
}

const setInstrument = (i: number, instrument: StoreSetter<Instrument, [number, "instruments"]> ) => 
  setStore("instruments", i, instrument)

const setSelectedInstrument = function(...args: any[]){
  setStore("instruments", store.selection.instrumentIndex , ...args)
}


const cloneFxChains = async (fxChains: DSPElement[][]) => (
  Promise.all(fxChains.map(fxChain => 
    Promise.all(fxChain.map(async fxElement => {
      if("factoryId" in fxElement){
        const factory = store.faustFactories.find(({id})=> id === (fxElement as FaustElement).factoryId )
        const node =  await createFaustNode(factory!.dsp)
        return {
          ...(fxElement as FaustElement),
          id: zeptoid(),
          connection: undefined,
          parameters: deepClone((fxElement as FaustElement).parameters),
          node
        }
      }else{
        const node = new GainNode(store.context!);
        return {
          ...(fxElement as WebAudioElement),
          id: zeptoid(),
          connection: undefined,
          node
        }
      }
    }))
  ))
)

const cloneSelectedInstrument = async () => {

  const {audioBuffer, waveform, fxChains, selection, index } = getSelectedInstrument() as Sampler;
  const sampler = defaultSampler();

  const newChains = await cloneFxChains(fxChains);


  const unusedInstrument = store.instruments.filter(v => v.index !== index).find(instrument => {
    // TODO : i don t think this works at all
    // should fix when i start working with synths again
    console.log(instrument.audioBuffer);
    if(instrument.audioBuffer === undefined){
      console.log("this happens")
      return true;
    }
  })

  if(unusedInstrument){
    sampler.index = unusedInstrument.index;
    setStore("instruments", sampler.index, sampler);
    setSelectedInstrumentIndex(sampler.index);
  }else{
    setStore("instruments", instruments => [...instruments, sampler]);
    setSelectedInstrumentIndex(store.instruments.length - 1);
  }

  console.log(unusedInstrument);

  setSelectedInstrument("selection", newChains);
  setSelectedInstrument("color", getHex());

  setSelectedInstrument("fxChains", newChains);
  getSelectedInstrument().fxChains.forEach((fxChain: DSPElement[]) => {
    updateFxChain(fxChain)
  })

  if(audioBuffer && waveform){
    setSamplerAudioBuffer(cloneAudioBuffer(audioBuffer, store.context!));
    setSamplerWaveform(deepClone(waveform));
    setSamplerSelection("start", selection.start)
    setSamplerSelection("end", selection.end)
  }
}


const setSamplerNavigation = (type: "start" | "end", value: ((x: number) => number) | number) => 
  setSelectedInstrument("navigation", type, value);

const setSamplerSelection = (type: "start" | "end", value: ((x: number) => number) | number) => 
  setSelectedInstrument("selection", type, value)

const setSamplerWaveform = (waveform: Waveform) => 
  setSelectedInstrument("waveform", waveform)

const setSamplerAudioBuffer = (audioBuffer: AudioBuffer) => 
  setSelectedInstrument("audioBuffer", audioBuffer)

const processSelectedSamplerArrayBuffer = async ({arrayBuffer, name}:{arrayBuffer: ArrayBuffer, name: string}) => {
    const waveform = await arrayBufferToWaveform(copyArrayBuffer(arrayBuffer), store.context!)
    setSamplerWaveform(waveform);
    const audioBuffer = await store.context!.decodeAudioData(copyArrayBuffer(arrayBuffer))
    setSamplerAudioBuffer(audioBuffer)
    setSamplerSelection("start", 0)
    setSamplerSelection("end", waveform.length)
  }

const addToArrayBuffers = (data: {name: string, arrayBuffer: ArrayBuffer}) => 
  setStore("audioBuffers", audioBuffers => [...audioBuffers, data])


const setSamplerSpeed = (speed: StoreSetter<number, ["speed"]>) => {
  batch(() => {
    setSelectedInstrument("speed", speed);
    const sampler = (getSelectedInstrument() as Sampler)
    if(sampler.speed < 0 && !sampler.inverted || sampler.speed > 0 && sampler.inverted){
      revertSamplerAudiobuffer();
      setSelectedInstrument("inverted", (inverted: boolean) => !inverted);
    }
    store.tracks.forEach((track, index) => {
      if(track.instrument === sampler){
        const speed = sampler.speed;
        if(track.source){
          track.source.playbackRate.value = speed;
  
          const semitones = getTrackSemitones(track.frequency, Math.abs(speed))
          const shift = getTrackShift(index);
          const totalPitch = semitones + shift!.value;
        
          track.pitchshifter?.setParamValue("/Pitch_Shifter/shift", totalPitch)
        }
      }
    })
  })

}

const revertSamplerAudiobuffer = async () => {
  const {audioBuffer, waveform, selection, navigation} = getSelectedInstrument() as Sampler;
  
  if(!store.context || !audioBuffer || !waveform) return;

  const clonedBuffer = cloneAudioBuffer(audioBuffer, store.context);
  Array.prototype.reverse.call( clonedBuffer.getChannelData(0) );
  Array.prototype.reverse.call( clonedBuffer.getChannelData(1) ); 
  setSelectedInstrument("audioBuffer", clonedBuffer)
  
  const clonedBuffer2 = cloneAudioBuffer(clonedBuffer, store.context);
  const reversedWaveform = await audioBufferToWaveform(clonedBuffer2, store.context)
  actions.setSamplerWaveform(reversedWaveform);

  var {start, end} = selection;
  setSamplerSelection("start", waveform.length - end)
  setSamplerSelection("end", waveform.length - start)

  var {start, end} = navigation;
  setSamplerNavigation("start", end)
  setSamplerNavigation("end", start)
}

const addInstrument = () => {
  const sampler = defaultSampler();
  setStore("instruments", instruments => [...instruments, sampler]);
  setSelectedInstrumentIndex(store.instruments.length - 1)
}

const getColorInstrument = (instrumentIndex: number) => {
  const instrument = store.instruments[instrumentIndex];
  if(instrument.active){
    return instrument.color;
  }
  return ""
} 


const incrementSelectedPatternId = (e: MouseEvent) => {
  const offset = getLocalPosition(e).percentage.y > 50 ? 1 : -1
  const index = store.patterns.findIndex(pattern => pattern.id === store.selection.patternId)
  
  let nextIndex = (index + offset) % store.patterns.length
  if (nextIndex < 0) nextIndex = store.patterns.length - 1

  setStore("selection", "patternId", store.patterns[nextIndex].id)
}
const setSelectedPatternId = (id: string) => setStore("selection", "patternId", id);  
const getSelectedPattern = () => store.patterns.find(pattern => pattern.id === store.selection.patternId)
const getSelectedPatternIndex = () => store.patterns.findIndex(pattern => pattern.id === store.selection.patternId)

const clearSelectedPattern = () => setStore("patterns", getSelectedPatternIndex(), "sequences", initSequences())
const copySelectedPattern = () => {
  const json = JSON.stringify(store.patterns[getSelectedPatternIndex()]);
  const clonedPattern = JSON.parse(json)
  clonedPattern.id = zeptoid()
  // clonedPattern.color = getHex(JSON.stringify(store.patterns[getSelectedPatternIndex()].sequences));
  clonedPattern.color = getHex();
/*   createEffect(()=>{


    const sequences = store.patterns.find(pattern => pattern.id === clonedPattern.id)?.sequences;

    setStore("patterns", pattern => pattern.id === clonedPattern.id, "color", getHex(JSON.stringify(sequences)));

  }) */

  setStore("patterns", produce((patterns: Pattern[]) => patterns.splice(getSelectedPatternIndex() + 1, 0, clonedPattern)))
  setStore("selection", "patternId", clonedPattern.id)

  createEffect(()=>{
    
  })
}


const createFaustElementFromFaustFactory = async (
  {
    factory, id, detachable, active, parameters
  } 
  : {
    factory: FaustFactory, 
    id: string, 
    detachable?: boolean
    active: boolean
    parameters?: FxParameter[]
  }

) : Promise<FaustElement | undefined> => {
  const n = await createFaustNode(factory.dsp);
  if(!n) return;
  // const [node, setNode] = createSignal(n);

  const initialElement = {
    id,
    factoryId: factory.id,
    node: n,
    name: () => initialElement.node.dspMeta.name,
    parameters: parameters || deepClone(factory.parameters),
    detachable: detachable === undefined ? true : detachable,
    active,
    connection: undefined
  };

  const [element, setElement] = createStore<FaustElement>(initialElement)


  let init = false;
  createEffect(async () =>{ 
    // needed to trigger reactivity;
    const dsp = factory.dsp

    if(!init) {
      init = true;
      return;
    }
    if(!store.context) return;
    const node = await createFaustNode(dsp)
    if(!node) return;
    setElement("node", node)
    if(element.connection)
      node.connect(element.connection /* || store.context?.destination */)
  })

  const equal = (array1: string[], array2: string[]) => {
    if(array1.length !== array2.length) return false;
    let result = true;
    array1.some((value) => {
      if(array2.indexOf(value) === -1){
        result = false;
        return true;
      }
    })
    return result;
  }

  const equalParameters = (parameters1: FxParameter[], parameters2: FxParameter[]) => {
    const labels1 = parameters1.map(v => v.label);
    const labels2 = parameters2.map(v => v.label);
    return equal(labels1, labels2)
  }

  createEffect(() =>{ 
    const dsp = factory.dsp
    const newParameters = collectParameters(factory.dsp); 
    const existingParameters = untrack(()=> element.parameters);

    if(!equalParameters(newParameters, existingParameters)){
      const mergedParameters = newParameters.map(parameter => {
        const existingParameter = existingParameters.find(p => p.label === parameter.label)
        return existingParameter || parameter;
      })
      setElement("parameters", mergedParameters)
    }

  })
  // const faustNode = createMemo(() => createFaustNode(factory.dsp));
  return element
}

const getActiveElementFromFxChain = (fxChain: DSPElement[], index: number) => {
  while(true){
    if(fxChain[index].active) {
      return fxChain[index]
    }else{
      index--;
    }
    // TODO: change in case we change fxChain[0] being nothing
    if(index < 0) return fxChain[0];
  }


}

const updateFxChain = (fxChain: DSPElement[], rootNode?: FaustAudioWorkletNode | AudioNode) => {

  const [_, setFxChain] = createStore(fxChain);
  const context = store.context;
  if(!context) return

  fxChain.forEach((fxElement: DSPElement, index: number) => {
    if(index === 0) {
      if(!rootNode) return;
      if(fxElement.connection !== rootNode){
        if(fxElement.connection)
          fxElement.node.disconnect(fxElement.connection);
        fxElement.node.connect(rootNode);
        setFxChain(0, "connection", rootNode);
      }
      return;
    }
    
    const node = fxElement.node;
    const prev = getActiveElementFromFxChain(fxChain, index - 1)
    
    if(fxElement.active) {
      if(fxElement.connection !== prev.node && fxElement.connection){
        node.disconnect(fxElement.connection);
      }
      node.connect(prev.node)
    }else{
  /*    
      if(fxElement.connection){
        try{
          node.disconnect(fxElement.connection);
        }catch(err){
          console.error("error while disconnecting node: ", err)
        }
      } */
    }
    setFxChain(index, "connection", prev?.node);
  })
}

const getEntryFxTrack = (trackIndex: number) => {
  const fxChain = store.tracks[trackIndex].fxChain;
  // return fxChain[fxChain.length - 1].node
  return  getActiveElementFromFxChain(fxChain, fxChain.length - 1);
}




const createNodeAndAddToFxChainInstrument = async (
  {factory, id, detachable, parameters, active} : 
  {factory: FaustFactory, id: string, detachable?: boolean, parameters?: any[], active: boolean}
) => {



  if(getSelectedInstrument().compilingIds.find(compilingId => compilingId === id)) return;
  setSelectedInstrument("compilingIds", (compilingIds: string[]) => [...compilingIds, id]);

  const elements: FaustElement[] = await Promise.all(
    getSelectedInstrument().fxChains.map((_,i) => createFaustElementFromFaustFactory({factory, id, detachable, active, parameters}))
  )

  // batch(() => {
    console.log('happens only once')
    let error;
    elements.forEach((fxElement, i) => {
      if(!fxElement){
        error = true
        return;
      }
      const [element, setElement] = createStore<FaustElement>(fxElement);

      console.log('happens')

      createEffect(() => {
        const parameters = deepClone(elements[0]?.parameters);
        if(i === 0 || !parameters) return;

        setElement("parameters", parameters);
      })

      let isInitialized = Initialized();
      createEffect(() => {
        if(!isInitialized(elements[0]!.active)) return;
        setElement("active", elements[0]!.active)

        updateFxChain(getSelectedInstrument().fxChains[i])
      })

      createEffect(()=>{
        element.parameters.forEach(({address, value}) => {
          element.node.setParamValue(address, value)
        })
      })

      setSelectedInstrument("fxChains", i, (fxChain: DSPElement[]) => ARRAY.insert(fxChain, fxChain.length - 1, element)) 
    })
    if(error) return;
    getSelectedInstrument().fxChains.forEach((fxChain, index) => updateFxChain(fxChain, getEntryFxTrack(index).node))
  // })

  setSelectedInstrument("compilingIds", (compilingIds: string[]) => 
    compilingIds.filter(compilingId => compilingId  !== id)
  );
}

const createNodeAndAddToFxChainTrack = async (
  {factory, id, trackIndex, detachable, parameters, active} 
  : {
    factory: FaustFactory
    id: string
    trackIndex?: number
    detachable?: boolean
    parameters?: any[]
    active: boolean
  }, 
  index: number,
  update: boolean = true
) => {
  const track = trackIndex ? store.tracks[trackIndex] : getSelectedTrack();
  if(track.compilingIds.find(compilingId => compilingId === id)) return;
  setSelectedTrack("compilingIds", (compilingIds: string[]) => [...compilingIds, id]);

  const element = await createFaustElementFromFaustFactory({factory, id, detachable, active, parameters})
  if(!element){
    console.error("error while creating fxNode from faustFactory");
    return;
  }

/*   if(parameters)
    fxNode.parameters = parameters; */
  
  trackIndex = trackIndex !== undefined ? trackIndex : store.selection.trackIndex;
  setStore("tracks", trackIndex, "fxChain", (fxChain) => ARRAY.insert(fxChain, index, element))
  if(update){ 

  
    updateFxChain(store.tracks[trackIndex].fxChain, store.rootNode)
  }
  let init1 = false
  createEffect(()=>{
    element.parameters.forEach(({address, value, label}) => {
      if(element.node === track.pitchshifter && label === "shift"){
        element.node.setParamValue(address, value + track.semitones)
      }else{
        element.node.setParamValue(address, value)
      }
    })
  })

  let isInitialized = Initialized();
  createEffect(() => {
    if(!isInitialized(element.active)) return;
    updateFxChain(track.fxChain, store.rootNode)
  })


/*   if(store.context && store.tracks[trackIndex].fxChain.length > 0){


    store.tracks[trackIndex].fxChain[0].node.connect(store.context?.destination); 
  } */
  setSelectedTrack("compilingIds", (compilingIds: string[]) => 
    compilingIds.filter(compilingId => compilingId  !== id)
  );
  return element;
}

const removeNodeFromFxChainInstrument = (
  id: string
) => batch(()=>{
  getSelectedInstrument().fxChains.forEach((fxChain, index) => {
    setSelectedInstrument("fxChains", index, (fxChain: DSPElement[]) => fxChain.filter(fx => fx.id !== id))
    updateFxChain(fxChain, getEntryFxTrack(index).node)
  })
})

const removeNodeFromFxChainTrack = (
  id: string,
  trackIndex?: number
) => {
  const index = trackIndex !== undefined ? trackIndex : store.selection.trackIndex;
  setStore("tracks", index, "fxChain", (fxChain) => fxChain.filter(fx => fx.id !== id))
  setTimeout(()=>updateFxChain(store.tracks[index].fxChain, store.rootNode), 500)
}

const updateOrderFxChainTrack = (
  index1: number,
  index2: number
) => {
  setSelectedTrack("fxChain", produce((fxChain: DSPElement[]) => {
      var element = fxChain[index1];
      fxChain.splice(index1, 1);
      fxChain.splice(index2, 0, element);
  }))
  updateFxChain(getSelectedTrack().fxChain, store.rootNode)
}


const updateOrderFxChainInstrument = (
  index1: number,
  index2: number
) => batch(()=>{
  getSelectedInstrument().fxChains.forEach((fxChain, index) => {
    setSelectedInstrument("fxChains", index, produce((fxChain: FaustElement[]) => {
      var element = fxChain[index1];
      fxChain.splice(index1, 1);
      fxChain.splice(index2, 0, element);
    
    }))
    updateFxChain(fxChain, getEntryFxTrack(index).node)
  })
})


const getSelectedTrack = () => store.tracks[store.selection.trackIndex]
const setSelectedTrack = (...args: any[]) => 
  setStore("tracks", store.selection.trackIndex, ...args); 

const setSelectedTrackIndex = (index: number) => {
  setStore("selection", "trackIndex", index);
}

const toggleTrackMode = () => {
  setStore("playMode", (playMode) => playMode === "composition" ? "pattern" : "composition");
  if(store.playMode === "composition"){
    setStore("clockOffset", store.clock);
  }
}

const getPatternIndex = (patternId: string) => store.patterns.findIndex(pattern =>pattern.id === patternId)
const getPatternColor = (patternId: string) =>  store.patterns.find(pattern =>pattern.id === patternId)?.color || ""

const getBlockIndex = (blockId: string) => store.composition.findIndex(block => block.id === blockId) 

const getTrackSemitones = (frequency: number, speed: number) => {
  const midi = ftom(frequency);
  return midi - ftom(ROOT_FREQUENCY * speed);
}

const getTrackShift = (index: number) => {
  const fxData = store.tracks[index].fxChain.find(fx => fx.node === store.tracks[index].pitchshifter);
  return fxData!.parameters.find((parameter: FxParameter) => parameter.label === "shift");
}

function playSampler(instrument: Sampler, trackIndex: number, frequency: number) {
  const {audioBuffer, selection, speed} = instrument;

  if(!store.context || !audioBuffer) return;
  if(store.tracks[trackIndex].source){
    store.tracks[trackIndex].source!.stop();
  }
  const source = store.context.createBufferSource();
  source.buffer = audioBuffer;
  source.playbackRate.value = speed;


  const fxChainTrack = store.tracks[trackIndex].fxChain;
  const fxEntryTrack = fxChainTrack[fxChainTrack.length - 1];

  const fxChainInstrument = instrument.fxChains[trackIndex];
  const fxEntryInstrument = fxChainInstrument[fxChainInstrument.length - 1];
  const fxExitInstrument = fxChainInstrument[0];


  console.log("SOURCE YES", selection.start, selection.end);

  // source.connect(store.context.destination)
  if(fxEntryInstrument){
    source.connect(fxEntryInstrument.node)
    fxExitInstrument.node.connect(fxEntryTrack?.node/*  || store.context.destination */)
  }else{
    source.connect(fxEntryTrack?.node /* || store.context.destination */)
  }
  
  setStore("tracks", trackIndex, "source", source);
  setStore("tracks", trackIndex, "instrumentIndex", instrument.index)

  const duration = ((selection.end - selection.start) * 128  ) / audioBuffer.length * (audioBuffer.duration ) ;
  const start = (selection.start * 128) / audioBuffer.length * audioBuffer.duration;
  source.start(0, start, duration);

  const semitones = getTrackSemitones(frequency, Math.abs(speed))
  const shift = getTrackShift(trackIndex);
  const totalPitch = semitones + shift!.value;

  setStore("tracks", trackIndex, "semitones", semitones);
  setStore("tracks", trackIndex, "frequency", frequency);

  store.tracks[trackIndex].pitchshifter?.setParamValue("/Pitch_Shifter/shift", totalPitch)
}

const playNote = (instrumentIndex: number, frequency: number, track: number) => {
  const instrument = store.instruments[instrumentIndex];
  if(!instrument.active) return;

  switch(instrument.type){
    case "synth":
      if(instrument.node){
        instrument.node.setParamValue(
          "/FaustDSP/freq",
          frequency
        )
        instrument.node.setParamValue("/FaustDSP/drop", 0.9 + ((store.clock / 10000) % 0.1))
      }
      break;
    case "sampler":
      if(instrument.audioBuffer){
        playSampler(instrument, track, frequency)
      }
      break;
  }
}

const renderAudio = () => {
  let pattern;
  if(store.playMode === "composition"){
    const totalLength = store.composition.length * SEQUENCE_LENGTH;
    const compositionClock = (store.clock - store.clockOffset);
    const index = Math.floor(compositionClock / SEQUENCE_LENGTH);
    // if(compositionClock/totalLength > 1) setStore("clockOffset", store.clock);

    const block = store.composition[index];
    if(!block) {
      pattern = getSelectedPattern()
    }else{
      const {patternId, id} = store.composition[index];
      pattern = store.patterns.find(pattern => pattern.id === patternId);
      setStore("selection", "blockId", id);
      setStore("selection", "patternId", patternId);

    }
  }else{
    pattern = getSelectedPattern()
  }

  if(!pattern) return;
  const tick = store.clock % pattern.sequences[0].length;
  let activeInstruments : {[key: string]: any}= {};
  pattern.sequences.forEach((sequence, track) => {
    const note = {...sequence[tick], track};
    if(note.active){
      playNote(note.instrumentIndex, note.frequency, note.track)
    }
  })
}

const setDragging = (type: "fx", data: any) => setStore("dragging", type, data)

const addToEditors = (editor: {
  id: string
  code: string
  oncompile: (dsp: TCompiledDsp) => void
}) => {
  if(store.editors.find(e => editor.id === e.id)) return;
  setStore("editors", (editors) => [...editors, editor])
}
const removeFromEditors = (id: string) => {
  
  setStore("editors", (editors) => editors.filter((editor) => {
    
    return editor.id !== id
  }))
}

// let audioRecorder: ;
const recordAudio = async (type: "file" | "resample" | "mic") => { 
  if(!store.context) return;
  if(!store.audioRecorder){

    if(type === "mic"){
      const microphoneStream = await getMicrophoneStream();
      if(!microphoneStream){
        console.error("could not create microphonestream");
        return;
      }
      const recorder = new StreamRecorder(microphoneStream);
      setStore("audioRecorder", {type, recorder})
    }else{
      const recorder = new AudioNodeRecorder(store.rootNode!, store.context)
      setStore("audioRecorder", {type, recorder})
    }

  }else{
    const blob = await store.audioRecorder.recorder.stop();

    if(store.audioRecorder.type === "file"){
      const a = document.createElement('a');
      a.setAttribute('href', URL.createObjectURL(blob));
      a.setAttribute('download', "music.ogg");
      a.click()
    }else{
      const arrayBuffer = await blob.arrayBuffer();
      const sampler = defaultSampler(store.instruments.length);
      setStore("instruments", instruments => [...instruments, sampler] )
      setSelectedInstrumentIndex(store.instruments.length - 1);
      const index = store.audioBuffers.filter(({name}) => name.startsWith("recording")).length;
      const name = `recording_${index}`;
      actions.addToArrayBuffers({arrayBuffer, name});
      await processSelectedSamplerArrayBuffer({arrayBuffer, name})
    }
    setStore("audioRecorder", undefined)

  }
}

const getMicrophoneStream = async () => {
  if(!store.mic){
    setStore("mic", await getWebAudioMediaStream());
  }
  return store.mic;
}

const togglePlaying = () => {
  if(!store.bools.playing) 
    setStore("clockOffset", performance.now() - store.clock * bpmToMs(store.bpm))

  setStore("bools", "playing", (bool) => !bool)
  if(store.bools.playing){
    renderAudio()
  }else{
    store.tracks.forEach((track) => {
      track.source?.stop();
    })
  }
}

const resetPlaying = () => {
  batch(()=>{

    store.tracks.forEach((track) => {
      track.source?.stop();
    })
    setStore("clock", 0);
    setStore("bools", "playing", false)
  })
}

const setClock = (index: number) => {
  setStore("clock", index);
  setStore("clockOffset", performance.now() - store.clock * bpmToMs(store.bpm))
  renderAudio();
}

const actions = {
  initContext, initFaust, initKeyboard, initTracks, initFx, initClock, /* initCodeMirror, */
  setBPM, setPlayMode,
  compileFaust, createFactory, updateFaustFactory,
  getSelectedInstrument, setSelectedInstrumentIndex, cloneSelectedInstrument,
  setInstrument, getColorInstrument, initInstruments,
  createNodeAndAddToFxChainInstrument, removeNodeFromFxChainInstrument, updateOrderFxChainInstrument,
  toggleTypeSelectedInstrument, 
  setSamplerNavigation, setSamplerSelection, 
  setSamplerWaveform, setSamplerAudioBuffer,
  processSamplerArrayBuffer: processSelectedSamplerArrayBuffer,
  addToArrayBuffers,
  addInstrument,
  setSamplerSpeed, revertSamplerAudiobuffer,
  createFaustNode, 
  playNote, 
  toggleTrackMode, 
  setSelectedTrackIndex,
  getSelectedTrack,
  createNodeAndAddToFxChainTrack, removeNodeFromFxChainTrack, updateOrderFxChainTrack,
  setSelectedPatternId, incrementSelectedPatternId, getSelectedPattern, clearSelectedPattern, copySelectedPattern, 
  getPatternIndex, getPatternColor,
  getBlockIndex,
  renderAudio,
  setDragging,
  addToEditors, removeFromEditors,
  recordAudio,
  togglePlaying, resetPlaying,
  setClock,
  
}


export { store, setStore, actions };

