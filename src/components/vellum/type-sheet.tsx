import {
  FONT_OPTIONS,
  LEADING_OPTIONS,
  MARGIN_OPTIONS,
  THEME_OPTIONS,
  VOICE_OPTIONS,
  type Settings,
} from "@/lib/reading/model";
import { updateSettings } from "@/lib/reading/store";

export function TypeSheet({ settings, onClose }: { settings: Settings; onClose: () => void }) {
  return (
    <>
      <button type="button" className="sheet-backdrop" aria-label="Close type settings" onClick={onClose} />
      <div className="sheet" role="dialog" aria-label="Type">
        <div className="grabber" />
        <p className="aa">Aa</p>
        <div className="size-row">
          <span className="a-small" aria-hidden="true">
            A
          </span>
          <input
            className="line"
            type="range"
            min={0}
            max={6}
            step={1}
            value={settings.sizeIndex}
            aria-label="Font size"
            onChange={(event) => updateSettings({ sizeIndex: Number(event.target.value) })}
          />
          <span className="a-large" aria-hidden="true">
            A
          </span>
        </div>
        <p className="section-label">Font</p>
        <div className="font-grid">
          {FONT_OPTIONS.map((font) => (
            <button
              key={font.id}
              type="button"
              className="font-card"
              data-on={settings.font === font.id}
              onClick={() => updateSettings({ font: font.id })}
            >
              <span className="sample" style={{ fontFamily: font.family }}>
                Reading
              </span>
              <span className="fname">{font.label}</span>
            </button>
          ))}
        </div>
        <p className="section-label spaced">Spacing</p>
        <div className="chip-row">
          {LEADING_OPTIONS.map((leading) => (
            <button
              key={leading.id}
              type="button"
              className="chip"
              data-on={settings.leading === leading.id}
              onClick={() => updateSettings({ leading: leading.id })}
            >
              {leading.label}
            </button>
          ))}
        </div>
        <p className="section-label spaced">Margins</p>
        <div className="chip-row">
          {MARGIN_OPTIONS.map((margin) => (
            <button
              key={margin.id}
              type="button"
              className="chip"
              data-on={settings.margin === margin.id}
              onClick={() => updateSettings({ margin: margin.id })}
            >
              {margin.label}
            </button>
          ))}
        </div>
        <p className="section-label spaced">Theme</p>
        <div className="swatches">
          {THEME_OPTIONS.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className={`swatch swatch-${theme.id}`}
              data-on={settings.theme === theme.id}
              aria-label={theme.label}
              aria-pressed={settings.theme === theme.id}
              onClick={() => updateSettings({ theme: theme.id })}
            />
          ))}
        </div>
        <p className="section-label spaced">Voice</p>
        <div className="voice-row">
          {VOICE_OPTIONS.map((voice) => (
            <button
              key={voice.id}
              type="button"
              className="choice"
              data-on={settings.voice === voice.id}
              onClick={() => updateSettings({ voice: voice.id })}
            >
              {voice.label}
            </button>
          ))}
        </div>
        <p className="book-meta sheet-note">
          Mara, Jonah, and Helen use the best matching English voice on this phone.
        </p>
      </div>
    </>
  );
}
