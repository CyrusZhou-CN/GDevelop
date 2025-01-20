namespace gdjs {
  const supportedInputTypes = [
    'text',
    'email',
    'password',
    'number',
    'telephone number',
    'url',
    'search',
    'text area',
  ] as const;
  const supportedtextAlign = ['left', 'center', 'right'] as const;

  type SupportedInputType = typeof supportedInputTypes[number];
  type SupportedtextAlign = typeof supportedtextAlign[number];
  const parseInputType = (potentialInputType: string): SupportedInputType => {
    const lowercasedNewInputType = potentialInputType.toLowerCase();

    // @ts-ignore - we're actually checking that this value is correct.
    if (supportedInputTypes.includes(lowercasedNewInputType))
      return potentialInputType as SupportedInputType;

    return 'text';
  };

  const parseTextAlign = (potentialTextAlign: string): SupportedtextAlign => {
    const lowercasedNewTextAlign = potentialTextAlign.toLowerCase();

    // @ts-ignore - we're actually checking that this value is correct.
    if (supportedtextAlign.includes(lowercasedNewTextAlign))
      return potentialTextAlign as SupportedtextAlign;

    return 'left';
  };

  /** Base parameters for {@link gdjs.TextInputRuntimeObject} */
  export interface TextInputObjectData extends ObjectData {
    /** The base parameters of the TextInput */
    content: {
      initialValue: string;
      placeholder: string;
      fontResourceName: string;
      fontSize: float;
      inputType: SupportedInputType;
      textColor: string;
      fillColor: string;
      fillOpacity: float;
      padding: integer;
      textAlign: SupportedtextAlign;
      maxLength: integer;
      borderColor: string;
      borderOpacity: float;
      borderWidth: float;
      disabled: boolean;
      readOnly: boolean;
    };
  }

  export type TextInputNetworkSyncDataType = {
    opa: float;
    wid: float;
    hei: float;
    txt: string;
    frn: string;
    fs: number;
    place: string;
    it: SupportedInputType;
    tc: string;
    fc: string;
    fo: float;
    bc: string;
    bo: float;
    bw: float;
    dis: boolean;
    ro: boolean;
  };

  export type TextInputNetworkSyncData = ObjectNetworkSyncData &
    TextInputNetworkSyncDataType;

  const DEFAULT_WIDTH = 300;
  const DEFAULT_HEIGHT = 30;

  /**
   * Shows a text input on the screen the player can type text into.
   */
  export class TextInputRuntimeObject
    extends gdjs.RuntimeObject
    implements gdjs.TextContainer, gdjs.Resizable, gdjs.OpacityHandler {
    private _string: string;
    private _placeholder: string;
    private opacity: float = 255;
    private _width: float = DEFAULT_WIDTH;
    private _height: float = DEFAULT_HEIGHT;
    private _fontResourceName: string;
    private _fontSize: float;
    private _inputType: SupportedInputType;
    private _textColor: [float, float, float];
    private _fillColor: [float, float, float];
    private _fillOpacity: float;
    private _padding: integer;
    private _textAlign: SupportedtextAlign;
    private _maxLength: integer;
    private _borderColor: [float, float, float];
    private _borderOpacity: float;
    private _borderWidth: float;
    private _disabled: boolean;
    private _readOnly: boolean;
    private _isSubmitted: boolean;
    _renderer: TextInputRuntimeObjectRenderer;

    constructor(
      instanceContainer: gdjs.RuntimeInstanceContainer,
      objectData: TextInputObjectData
    ) {
      super(instanceContainer, objectData);

      this._string = objectData.content.initialValue;
      this._placeholder = objectData.content.placeholder;
      this._fontResourceName = objectData.content.fontResourceName;
      this._fontSize = objectData.content.fontSize || 20;
      this._inputType = parseInputType(objectData.content.inputType);
      this._textColor = gdjs.rgbOrHexToRGBColor(objectData.content.textColor);
      this._fillColor = gdjs.rgbOrHexToRGBColor(objectData.content.fillColor);
      this._fillOpacity = objectData.content.fillOpacity;
      this._borderColor = gdjs.rgbOrHexToRGBColor(
        objectData.content.borderColor
      );
      this._borderOpacity = objectData.content.borderOpacity;
      this._borderWidth = objectData.content.borderWidth;
      this._disabled = objectData.content.disabled;
      this._readOnly = objectData.content.readOnly;
      this._padding = objectData.content.padding;
      this._textAlign = objectData.content.textAlign;
      this._maxLength = objectData.content.maxLength;
      this._isSubmitted = false;
      this._renderer = new gdjs.TextInputRuntimeObjectRenderer(
        this,
        instanceContainer
      );

      // *ALWAYS* call `this.onCreated()` at the very end of your object constructor.
      this.onCreated();
    }

    getRendererObject() {
      return null;
    }

    updateFromObjectData(
      oldObjectData: TextInputObjectData,
      newObjectData: TextInputObjectData
    ): boolean {
      if (
        oldObjectData.content.initialValue !==
        newObjectData.content.initialValue
      ) {
        if (this._string === oldObjectData.content.initialValue) {
          this.setString(newObjectData.content.initialValue);
        }
      }
      if (
        oldObjectData.content.placeholder !== newObjectData.content.placeholder
      ) {
        this.setPlaceholder(newObjectData.content.placeholder);
      }
      if (
        oldObjectData.content.fontResourceName !==
        newObjectData.content.fontResourceName
      ) {
        this.setFontResourceName(newObjectData.content.fontResourceName);
      }
      if (oldObjectData.content.fontSize !== newObjectData.content.fontSize) {
        this.setFontSize(newObjectData.content.fontSize);
      }
      if (oldObjectData.content.inputType !== newObjectData.content.inputType) {
        this.setInputType(newObjectData.content.inputType);
      }
      if (oldObjectData.content.textColor !== newObjectData.content.textColor) {
        this.setTextColor(newObjectData.content.textColor);
      }
      if (oldObjectData.content.fillColor !== newObjectData.content.fillColor) {
        this.setFillColor(newObjectData.content.fillColor);
      }
      if (
        oldObjectData.content.fillOpacity !== newObjectData.content.fillOpacity
      ) {
        this.setFillOpacity(newObjectData.content.fillOpacity);
      }
      if (
        oldObjectData.content.borderColor !== newObjectData.content.borderColor
      ) {
        this.setBorderColor(newObjectData.content.borderColor);
      }
      if (
        oldObjectData.content.borderOpacity !==
        newObjectData.content.borderOpacity
      ) {
        this.setBorderOpacity(newObjectData.content.borderOpacity);
      }
      if (
        oldObjectData.content.borderWidth !== newObjectData.content.borderWidth
      ) {
        this.setBorderWidth(newObjectData.content.borderWidth);
      }
      if (oldObjectData.content.disabled !== newObjectData.content.disabled) {
        this.setDisabled(newObjectData.content.disabled);
      }
      if (oldObjectData.content.readOnly !== newObjectData.content.readOnly) {
        this.setReadOnly(newObjectData.content.readOnly);
      }
      if (oldObjectData.content.maxLength !== newObjectData.content.maxLength) {
        this.SetMaxLength(newObjectData.content.maxLength);
      }
      if (oldObjectData.content.textAlign !== newObjectData.content.textAlign) {
        this._textAlign = newObjectData.content.textAlign;
        //this.setTextAlignement(newObjectData.content.textAlign);
      }
      if (oldObjectData.content.padding !== newObjectData.content.padding) {
        this.SetPadding(newObjectData.content.padding);
      }

      return true;
    }

    getNetworkSyncData(): TextInputNetworkSyncData {
      return {
        ...super.getNetworkSyncData(),
        opa: this.getOpacity(),
        wid: this.getWidth(),
        hei: this.getHeight(),
        txt: this.getText(),
        frn: this.getFontResourceName(),
        fs: this.getFontSize(),
        place: this.getPlaceholder(),
        it: this.getInputType(),
        tc: this.getTextColor(),
        fc: this.getFillColor(),
        fo: this.getFillOpacity(),
        bc: this.getBorderColor(),
        bo: this.getBorderOpacity(),
        bw: this.getBorderWidth(),
        dis: this.isDisabled(),
        ro: this.isReadOnly(),
      };
    }

    updateFromNetworkSyncData(syncData: TextInputNetworkSyncData): void {
      super.updateFromNetworkSyncData(syncData);

      if (syncData.opa !== undefined) this.setOpacity(syncData.opa);
      if (syncData.wid !== undefined) this.setWidth(syncData.wid);
      if (syncData.hei !== undefined) this.setHeight(syncData.hei);
      if (syncData.txt !== undefined) this.setText(syncData.txt);
      if (syncData.frn !== undefined) this.setFontResourceName(syncData.frn);
      if (syncData.fs !== undefined) this.setFontSize(syncData.fs);
      if (syncData.place !== undefined) this.setPlaceholder(syncData.place);
      if (syncData.it !== undefined) this.setInputType(syncData.it);
      if (syncData.tc !== undefined) this.setTextColor(syncData.tc);
      if (syncData.fc !== undefined) this.setFillColor(syncData.fc);
      if (syncData.fo !== undefined) this.setFillOpacity(syncData.fo);
      if (syncData.bc !== undefined) this.setBorderColor(syncData.bc);
      if (syncData.bo !== undefined) this.setBorderOpacity(syncData.bo);
      if (syncData.bw !== undefined) this.setBorderWidth(syncData.bw);
      if (syncData.dis !== undefined) this.setDisabled(syncData.dis);
      if (syncData.ro !== undefined) this.setReadOnly(syncData.ro);
    }

    updatePreRender(instanceContainer: RuntimeInstanceContainer): void {
      this._isSubmitted =false;
      this._renderer.updatePreRender();
    }

    /**
     * Initialize the extra parameters that could be set for an instance.
     */
    extraInitializationFromInitialInstance(initialInstanceData: InstanceData) {
      for (const property of initialInstanceData.stringProperties) {
        if (property.name === 'initialValue') {
          this.setString(property.value);
        } else if (property.name === 'placeholder') {
          this.setPlaceholder(property.value);
        }
      }
      if (initialInstanceData.customSize) {
        this.setWidth(initialInstanceData.width);
        this.setHeight(initialInstanceData.height);
      }
      if (initialInstanceData.opacity !== undefined) {
        this.setOpacity(initialInstanceData.opacity);
      }
    }

    onScenePaused(runtimeScene: gdjs.RuntimeScene): void {
      this._renderer.onScenePaused();
    }

    onSceneResumed(runtimeScene: gdjs.RuntimeScene): void {
      this._renderer.onSceneResumed();
    }

    onDestroyed(): void {
      super.onDestroyed();
      this._renderer.onDestroy();
    }

    setOpacity(opacity: float): void {
      this.opacity = Math.max(0, Math.min(255, opacity));
      this._renderer.updateOpacity();
    }

    getOpacity(): float {
      return this.opacity;
    }

    setSize(width: number, height: number): void {
      this.setWidth(width);
      this.setHeight(height);
    }

    setWidth(width: float): void {
      this._width = width;
    }

    setHeight(height: float): void {
      this._height = height;
    }

    /**
     * Return the width of the object.
     * @return The width of the object
     */
    getWidth(): float {
      return this._width;
    }

    /**
     * Return the width of the object.
     * @return The height of the object
     */
    getHeight(): float {
      return this._height;
    }

    /**
     * Get the text entered in the text input.
     * @deprecated use `getText` instead
     */
    getString() {
      return this.getText();
    }

    /**
     * Replace the text inside the text input.
     * @deprecated use `setText` instead
     */
    setString(text: string) {
      this.setText(text);
    }

    getText() {
      return this._string;
    }

    setText(newString: string) {
      if (newString === this._string) return;

      this._string = newString;
      this._renderer.updateString();
    }

    /**
     * Called by the renderer when the value of the input shown on the screen
     * was changed (because the user typed something).
     * This does not propagate back the value to the renderer, which would
     * result in the cursor being sent back to the end of the text.
     *
     * Do not use this if you are not inside the renderer - use `setString` instead.
     */
    onRendererInputValueChanged(inputValue: string) {
      this._string = inputValue;
    }
    
    onRendererFormSubmitted(inputValue: boolean) {
      this._isSubmitted = inputValue;
    }

    getFontResourceName() {
      return this._fontResourceName;
    }

    setFontResourceName(resourceName: string) {
      if (this._fontResourceName === resourceName) return;

      this._fontResourceName = resourceName;
      this._renderer.updateFont();
    }

    getFontSize() {
      return this._fontSize;
    }

    setFontSize(newSize: number) {
      this._fontSize = newSize;
    }

    /**
     * Get the placeholder shown when no text is entered
     */
    getPlaceholder() {
      return this._placeholder;
    }

    /**
     * Replace the text inside the text input.
     */
    setPlaceholder(newPlaceholder: string) {
      if (newPlaceholder === this._placeholder) return;

      this._placeholder = newPlaceholder;
      this._renderer.updatePlaceholder();
    }

    /**
     * Get the type of the input.
     */
    getInputType() {
      return this._inputType;
    }

    /**
     * Set the type of the input.
     */
    setInputType(newInputType: string) {
      const lowercasedNewInputType = newInputType.toLowerCase();
      if (lowercasedNewInputType === this._inputType) return;

      this._inputType = parseInputType(lowercasedNewInputType);
      this._renderer.updateInputType();
    }

    setTextColor(newColor: string) {
      this._textColor = gdjs.rgbOrHexToRGBColor(newColor);
      this._renderer.updateTextColor();
    }

    getTextColor(): string {
      return (
        this._textColor[0] + ';' + this._textColor[1] + ';' + this._textColor[2]
      );
    }

    _getRawTextColor(): [float, float, float] {
      return this._textColor;
    }

    setFillColor(newColor: string) {
      this._fillColor = gdjs.rgbOrHexToRGBColor(newColor);
      this._renderer.updateFillColorAndOpacity();
    }

    getFillColor(): string {
      return (
        this._fillColor[0] + ';' + this._fillColor[1] + ';' + this._fillColor[2]
      );
    }

    _getRawFillColor(): [float, float, float] {
      return this._fillColor;
    }

    setFillOpacity(newOpacity: float) {
      this._fillOpacity = Math.max(0, Math.min(255, newOpacity));
      this._renderer.updateFillColorAndOpacity();
    }

    getFillOpacity(): float {
      return this._fillOpacity;
    }

    setBorderColor(newColor: string) {
      this._borderColor = gdjs.rgbOrHexToRGBColor(newColor);
      this._renderer.updateBorderColorAndOpacity();
    }

    getBorderColor(): string {
      return (
        this._borderColor[0] +
        ';' +
        this._borderColor[1] +
        ';' +
        this._borderColor[2]
      );
    }

    _getRawBorderColor(): [float, float, float] {
      return this._borderColor;
    }

    setBorderOpacity(newOpacity: float) {
      this._borderOpacity = Math.max(0, Math.min(255, newOpacity));
      this._renderer.updateBorderColorAndOpacity();
    }

    getBorderOpacity(): float {
      return this._borderOpacity;
    }

    setBorderWidth(width: float) {
      this._borderWidth = Math.max(0, width);
      this._renderer.updateBorderWidth();
    }

    getBorderWidth(): float {
      return this._borderWidth;
    }

    setDisabled(value: boolean) {
      this._disabled = value;
      this._renderer.updateDisabled();
    }

    isDisabled(): boolean {
      return this._disabled;
    }

    setReadOnly(value: boolean) {
      this._readOnly = value;
      this._renderer.updateReadOnly();
    }

    isReadOnly(): boolean {
      return this._readOnly;
    }

    isFocused(): boolean {
      return this._renderer.isFocused();
    }
    isSubmitted(): boolean {
      return this._isSubmitted;
    }

    getMaxLength(): integer {
      return this._maxLength;
    }
    SetMaxLength(value: integer) {
      this._maxLength = value;
      this._renderer.updateMaxLength();
    }
    getPadding(): integer {
      return this._padding;
    }
    SetPadding(value: integer) {
      this._padding = value;
    }

    getTextAlign(): SupportedtextAlign {
      return this._textAlign;
    }

    setTextAlign(newTextAlign: string) {
      const lowercasedNewTextAlign = newTextAlign.toLowerCase();
      if (lowercasedNewTextAlign === this._textAlign) return;

      this._textAlign = parseTextAlign(lowercasedNewTextAlign);
      this._renderer.updateTextAlign();
    }

    focus(): void {
      if (!this.isFocused()) {
        // If the input was not previously focused, reset input manager because there is
        // no reason to maintain its state. It avoids bugs where a key is pressed, the text
        // input is focused and then the input manager does not have access to the keyup event
        // and considers the key still pressed.
        this.getInstanceContainer()
          .getGame()
          .getInputManager()
          .clearAllPressedKeys();
      }
      this._renderer.focus();
    }
  }
  gdjs.registerObject(
    'TextInput::TextInputObject',
    gdjs.TextInputRuntimeObject
  );
}
