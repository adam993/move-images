type BaseParamSpec<P> = {
  key: keyof P & string
  label: string
  /** Hide the control when it has no effect for the current params (e.g. direction for non-wave patterns). */
  visibleWhen?: (params: P) => boolean
}

export type RangeParamSpec<P> = BaseParamSpec<P> & {
  kind: 'range'
  min: number
  max: number
  step: number
  unit?: string
}

export type SelectParamSpec<P> = BaseParamSpec<P> & {
  kind: 'select'
  options: readonly { value: string; label: string }[]
}

export type ParamSpec<P> = RangeParamSpec<P> | SelectParamSpec<P>

export type EffectPreset<P> = { id: string; label: string; params: P }

/** Everything the UI needs to render an effect's controls and presets. One file per effect type. */
export type EffectDefinition<P> = {
  type: string
  label: string
  params: readonly ParamSpec<P>[]
  defaults: P
  presets: readonly EffectPreset<P>[]
}
