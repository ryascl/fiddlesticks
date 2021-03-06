import { FontCatalog, ParsedFonts } from 'font-shape'
import Cookies from 'js-cookie'
import { newid } from 'fstx-common'
import {
  EditorState,
  Operation,
  PositionedObjectRef,
  Sketch,
  SketchAttr,
  StoreResources,
  TextBlock,
  WorkspaceObjectRef,
} from './models'
import { interval, Subject } from 'rxjs'
import * as _ from 'lodash'
import { AppStore } from './app'
import { SketchActions, SketchEvents } from './channels'
import { getDefaultDrawing } from './data'
import { debounce } from 'rxjs/operators'

/**
 * The singleton Store controls all application state.
 * No parts outside of the Store modify application state.
 * Communication with the Store is done through message Channels:
 *   - Actions channel to send into the Store,
 *   - Events channel to receive notification from the Store.
 * Only the Store can receive action messages.
 * Only the Store can send event messages.
 * The Store cannot send actions or listen to events (to avoid loops).
 * Messages are to be treated as immutable.
 * All mentions of the Store can be assumed to mean, of course,
 *   "The Store and its sub-components."
 */
export class SketchStore {

  static BROWSER_ID_KEY = 'browserId'
  static FALLBACK_FONT_URL = '../fonts/Roboto-500.ttf'
  static SAVE_DELAY_MS = 500
  static GREETING_SKETCH_ID = 'im2ba92i1714i'
  static LOCAL_SKETCH_KEY = 'sketch'

  fontListLimit = 250

  state: EditorState = {}
  resources: StoreResources = {}
  actions = new SketchActions()
  events = new SketchEvents()

  private appStore: AppStore

  constructor(appStore: AppStore) {
    this.appStore = appStore

    this.setupState()

    this.setupSubscriptions()

    this.loadResources()
  }

  private _operation$ = new Subject<Operation>()

  get operation$() {
    return this._operation$.asObservable()
  }

  private _transparency$ = new Subject<boolean>()

  get transparency$() {
    return this._transparency$.asObservable()
  }

  setupState() {
    this.state.browserId = Cookies.get(SketchStore.BROWSER_ID_KEY)
    if (!this.state.browserId) {
      this.state.browserId = newid()
      Cookies.set(SketchStore.BROWSER_ID_KEY, this.state.browserId, { expires: 2 * 365 })
    }
  }

  setupSubscriptions() {
    const actions = this.actions, events = this.events

    // ----- Editor -----

    actions.editor.initWorkspace
      .subscribe(async m => {
        this.setSelection(null, true)
        this.setEditingItem(null, true)

        await this.loadInitialSketch()
        events.editor.workspaceInitialized.dispatch()

        // on any action, update save delay timer
        actions.observe().pipe(debounce(() => interval(SketchStore.SAVE_DELAY_MS)))
          .subscribe(() => {
            const sketch = this.state.sketch
            if (!this.state.loadingSketch
              && this.state.sketchIsDirty
              && sketch._id
              && sketch.textBlocks.length) {
              this.saveSketch(sketch)
            }
          })
      })

    actions.editor.loadFont.subscribe(m =>
      this.resources.parsedFonts.get(m.data))

    actions.editor.zoomToFit.forward(
      events.editor.zoomToFitRequested)

    actions.editor.exportPNG.subscribe(m => {
      this.setSelection(null)
      this.setEditingItem(null)
      events.editor.exportPNGRequested.dispatch(m.data)
    })

    actions.editor.exportSVG.subscribe(m => {
      this.setSelection(null)
      this.setEditingItem(null)
      events.editor.exportSVGRequested.dispatch(m.data)
    })

    actions.editor.viewChanged.subscribe(m => {
      events.editor.viewChanged.dispatch(m.data)
    })

    actions.editor.toggleHelp.subscribe(() => {
      this.state.showHelp = !this.state.showHelp
      events.editor.showHelpChanged.dispatch(this.state.showHelp)
    })

    actions.editor.openSample.sub(() => this.loadGreetingSketch())

    // ----- Sketch -----

    actions.sketch.create.sub((attr) => {
      this.newSketch(attr)
    })

    actions.sketch.clear.sub(() => {
      this.clearSketch()
    })

    actions.sketch.clone.subscribe(() => {
      const clone = _.clone(this.state.sketch)
      clone._id = newid()
      clone.browserId = this.state.browserId
      clone.savedAt = null
      this.loadSketch(clone)
      this.state.sketchIsDirty = false
      this.events.sketch.cloned.dispatch(clone)
      this.pulseUserMessage('Duplicated sketch. Address of this page has been updated.')
    })

    actions.sketch.attrUpdate.subscribe(ev => {
      this.merge(this.state.sketch, ev.data)
      this.state.sketch.backgroundColor = ev.data.backgroundColor
      events.sketch.attrChanged.dispatch(
        this.state.sketch)
      this.changedSketchContent()
    })

    actions.sketch.setSelection.subscribe(m => {
      this.setSelection(m.data)
      this.setEditingItem(m.data)
    })


    // ----- TextBlock -----

    actions.textBlock.add
      .subscribe(ev => {
        this.setEditingItem(null)

        let patch = ev.data
        if (!patch.text || !patch.text.length) {
          return
        }
        let block = { _id: newid() } as TextBlock
        this.merge(block, patch)

        block.textColor = this.state.sketch.defaultTextBlockAttr.textColor
        block.backgroundColor = this.state.sketch.defaultTextBlockAttr.backgroundColor
        if (!block.fontFamily) {
          block.fontFamily = this.state.sketch.defaultTextBlockAttr.fontFamily
          block.fontVariant = this.state.sketch.defaultTextBlockAttr.fontVariant
        }

        this.state.sketch.textBlocks.push(block)
        events.textblock.added.dispatch(block)
        this.changedSketchContent()

        this.loadTextBlockFont(block)
      })

    actions.textBlock.updateAttr
      .subscribe(ev => {
        let block = this.getBlock(ev.data._id)
        if (block) {
          let patch = {
            text: ev.data.text,
            backgroundColor: ev.data.backgroundColor,
            textColor: ev.data.textColor,
            fontFamily: ev.data.fontFamily,
            fontVariant: ev.data.fontVariant,
          } as TextBlock
          const fontChanged = patch.fontFamily !== block.fontFamily
            || patch.fontVariant !== block.fontVariant
          this.merge(block, patch)

          if (block.fontFamily && !block.fontVariant) {
            const record = this.resources.fontCatalog.getRecord(block.fontFamily)
            if (record) {
              // regular or else first variant
              block.fontVariant = FontCatalog.defaultVariant(record)
            }
          }

          this.state.sketch.defaultTextBlockAttr = {
            textColor: block.textColor,
            backgroundColor: block.backgroundColor,
            fontFamily: block.fontFamily,
            fontVariant: block.fontVariant,
          }

          events.textblock.attrChanged.dispatch(block)
          this.changedSketchContent()

          if (fontChanged) {
            this.loadTextBlockFont(block)
          }
        }
      })

    actions.textBlock.remove
      .subscribe(ev => {
        let didDelete = false
        _.remove(this.state.sketch.textBlocks, tb => {
          if (tb._id === ev.data._id) {
            didDelete = true
            return true
          }
        })
        if (didDelete) {
          events.textblock.removed.dispatch({ _id: ev.data._id })
          this.changedSketchContent()
          this.setEditingItem(null)
        }
      })

    actions.textBlock.updateArrange
      .subscribe(ev => {
        let block = this.getBlock(ev.data._id)
        if (block) {
          block.position = ev.data.position
          block.outline = ev.data.outline
          events.textblock.arrangeChanged.dispatch(block)
          this.changedSketchContent()
        }
      })
  }

  public showOperation(operation: Operation) {
    this.state.operation = operation
    operation.onClose = () => {
      if (this.state.operation === operation) {
        this.hideOperation()
      }
    }
    this._operation$.next(operation)
  }

  public hideOperation() {
    this.state.operation = null
    this._operation$.next(null)
  }

  public imageUploaded(src: string) {
    this.state.uploadedImage = src
    this.events.sketch.imageUploaded.dispatch(src)
    if (!this.state.transparency) {
      this.setTransparency(true)
    }
  }

  public removeUploadedImage() {
    this.state.uploadedImage = null
    this.events.sketch.imageUploaded.dispatch(null)
    if (this.state.transparency) {
      this.setTransparency(false)
    }
  }

  public setTransparency(value?: boolean) {
    this.state.transparency = value
    this._transparency$.next(this.state.transparency)
  }

  private loadResources() {
    this.resources.parsedFonts = new ParsedFonts(parsed =>
      this.events.editor.fontLoaded.dispatch(parsed.font))

    const catalog = FontCatalog.fromLocal()

    this.resources.fontCatalog = catalog

    // load fonts into browser for preview
    FontCatalog.loadPreviewSubsets(
      catalog.getList(this.fontListLimit).map(f => f.family))

    this.resources.parsedFonts.get(SketchStore.FALLBACK_FONT_URL)
      .then(({ font }) => this.resources.fallbackFont = font)

    this.events.editor.resourcesReady.dispatch(true)
  }

  private setUserMessage(message: string) {
    if (this.state.userMessage !== message) {
      this.state.userMessage = message
      this.events.editor.userMessageChanged.dispatch(message)
    }
  }

  private pulseUserMessage(message: string) {
    this.setUserMessage(message)
    setTimeout(() => this.setDefaultUserMessage(), 4000)
  }

  private setDefaultUserMessage() {
    // if not the last saved sketch, or sketch is dirty, show "Unsaved"
    const message = (this.state.sketchIsDirty
      || !this.state.sketch.savedAt)
      ? 'Unsaved'
      : 'Saved'
    this.setUserMessage(message)
  }

  private loadTextBlockFont(block: TextBlock) {
    this.resources.parsedFonts.get(
      this.resources.fontCatalog.getUrl(block.fontFamily, block.fontVariant))
      .then(({ font }) =>
        this.events.textblock.fontReady.dispatch(
          { textBlockId: block._id, font }))
  }

  private changedSketchContent() {
    this.state.sketchIsDirty = true
    this.events.sketch.contentChanged.dispatch(this.state.sketch)
    this.setDefaultUserMessage()
  }

  private merge<T>(dest: T, source: T) {
    _.merge(dest, source)
  }

  private newSketch(attr?: SketchAttr): Sketch {
    const sketch = this.defaultSketchAttr() as Sketch
    sketch._id = newid()
    if (attr) {
      this.merge(sketch, attr)
    }
    this.loadSketch(sketch)
    return sketch
  }

  private defaultSketchAttr() {
    return {
      browserId: this.state.browserId,
      defaultTextBlockAttr: {
        fontFamily: 'Roboto',
        fontVariant: 'regular',
        textColor: 'gray',
      },
      backgroundColor: 'white',
      textBlocks: [] as TextBlock[],
    } as SketchAttr
  }

  private saveSketch(sketch: Sketch) {
    this.setUserMessage('Saving')
    const now = new Date()
    sketch.savedAt = now
    localStorage.setItem(SketchStore.LOCAL_SKETCH_KEY, JSON.stringify(sketch))
    this.state.sketchIsDirty = false
    this.setDefaultUserMessage()
    this.appStore.actions.editorSavedSketch.dispatch(sketch._id)
    this.events.editor.snapshotExpired.dispatch(sketch)
  }

  private loadInitialSketch(): Promise<any> {
    const sketchJson = localStorage.getItem(SketchStore.LOCAL_SKETCH_KEY)
    if (sketchJson) {
      try {
        const sketch = JSON.parse(sketchJson) as Sketch
        if (sketch.textBlocks) {
          this.loadSketch(sketch)
          return Promise.resolve()
        }
      } catch (ex) {
        console.warn(`Failed to load local sketch: ${ex}`)
      }
    }
    return this.loadGreetingSketch()
  }

  private loadGreetingSketch() {
    this.loadSketch(getDefaultDrawing())
    return Promise.resolve('greeting')
  }

  private loadSketch(sketch: Sketch) {
    this.state.loadingSketch = true
    this.state.sketch = sketch
    this.state.sketchIsDirty = false
    this.setDefaultUserMessage()

    this.events.sketch.loaded.dispatch(this.state.sketch)
    this.appStore.actions.editorLoadedSketch.dispatch(sketch._id)
    for (const tb of this.state.sketch.textBlocks) {
      this.events.textblock.loaded.dispatch(tb)
      this.loadTextBlockFont(tb)
    }

    this.events.editor.zoomToFitRequested.dispatch()

    this.state.loadingSketch = false
  }

  private clearSketch() {
    const sketch = this.defaultSketchAttr() as Sketch
    sketch._id = this.state.sketch._id
    this.loadSketch(sketch)
  }

  private setSelection(item: WorkspaceObjectRef, force: boolean = true) {
    if (!force) {
      // early exit on no change
      if (item) {
        if (this.state.selection
          && this.state.selection.itemId === item.itemId) {
          return
        }
      } else {
        if (!this.state.selection) {
          return
        }
      }
    }

    this.state.selection = item
    this.events.sketch.selectionChanged.dispatch(item)
  }

  private setEditingItem(item: PositionedObjectRef, force?: boolean) {
    if (!force) {
      // early exit on no change
      if (item) {
        if (this.state.editingItem
          && this.state.editingItem.itemId === item.itemId) {
          return
        }
      } else {
        if (!this.state.editingItem) {
          return
        }
      }
    }

    if (this.state.editingItem) {
      // signal closing editor for item

      if (this.state.editingItem.itemType === 'TextBlock') {
        const currentEditingBlock = this.getBlock(this.state.editingItem.itemId)
        if (currentEditingBlock) {
          this.events.textblock.editorClosed.dispatch(currentEditingBlock)
        }
      }
    }

    if (item) {
      // editing item should be selected item
      this.setSelection(item)
    }

    this.state.editingItem = item
    this.events.sketch.editingItemChanged.dispatch(item)
  }

  private getBlock(id: string) {
    return _.find(this.state.sketch.textBlocks, tb => tb._id === id)
  }
}
    