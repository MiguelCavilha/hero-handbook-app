import type { Character } from '@/lib/types';
import { ABILITY_NAMES, ABILITY_LABELS, SKILL_LABELS, SKILL_ABILITY_MAP } from '@/lib/types';
import { translateApiTerm } from '@/lib/i18n/api-translation';
import {
  abilityModifier,
  formatModifier,
  proficiencyBonus,
  calcSavingThrow,
  calcSkillBonus,
  passivePerception,
  totalLevel,
  calcSpellSaveDC,
  calcSpellAttackBonus,
} from '@/lib/calculations';
import type { Translations } from '@/lib/i18n/pt';
import { getCharacterVisual } from '@/lib/character-visual';

interface Props {
  character: Character;
  t: Translations;
}

type PrintFieldProps = {
  label: string;
  value?: string | number | null;
};

type PrintBlockProps = {
  title: string;
  text?: string | null;
};

export function CharacterPrint({ character, t }: Props) {
  const level = totalLevel(character);
  const prof = proficiencyBonus(character);
  const dc = calcSpellSaveDC(character);
  const atk = calcSpellAttackBonus(character);
  const visual = getCharacterVisual(character);

  const portraitContent = character.portrait ? (
    <img src={character.portrait} alt={character.name || 'Character portrait'} />
  ) : visual?.emoji ? (
    <span className="print-portrait-placeholder">{visual.emoji}</span>
  ) : (
    <span className="print-portrait-placeholder">👤</span>
  );

  return (
    <div className="print-sheet">
      <div className="print-page">
        <div className="print-section">
          <div className="print-header">
            <div className="print-portrait">{portraitContent}</div>

            <div className="print-identity">
              <h1 className="print-name">{character.name || '—'}</h1>

              <div className="print-identity-grid">
                <PrintField
                  label={t.race}
                  value={`${translateApiTerm(t, 'races', character.race || '—')}${character.subrace ? ` (${translateApiTerm(t, 'subraces', character.subrace)})` : ''}`}
                />
                <PrintField
                  label={t.classLabel}
                  value={character.classes?.map((c) => {
                    const className = translateApiTerm(t, 'classes', c.name);
                    const subclass = c.subclass ? ` (${translateApiTerm(t, 'subclasses', c.subclass)})` : '';
                    return `${className}${subclass} ${c.level}`;
                  }).join(' / ') || '—'}
                />
                <PrintField label={t.background} value={translateApiTerm(t, 'backgrounds', character.background)} />
                <PrintField label={t.alignment} value={translateApiTerm(t, 'alignments', character.alignment)} />
                <PrintField label={t.level} value={String(level)} />
                <PrintField label={t.proficiency} value={formatModifier(prof)} />
                <PrintField label={t.experience} value={String(character.experience ?? 0)} />
                <PrintField label={t.playerName} value={character.playerName} />
              </div>
            </div>
          </div>

          <div className="print-divider" />

          <div className="print-combat-row">
            {[
              { label: t.armorClass, value: String(character.armorClass ?? 0) },
              { label: t.initiative, value: formatModifier(character.initiative ?? 0) },
              { label: t.speed, value: `${character.speed ?? 0} ft` },
              { label: 'HP', value: `${character.hpCurrent ?? 0}/${character.hpMax ?? 0}` },
              { label: t.passivePerception, value: String(passivePerception(character)) },
            ].map((s) => (
              <div key={s.label} className="print-combat-stat">
                <div className="print-combat-value">{s.value}</div>
                <div className="print-combat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="print-divider" />

          <div className="print-two-col">
            <div>
              <h3 className="print-section-title">{t.abilityScores}</h3>
              <div className="print-abilities">
                {ABILITY_NAMES.map((ab) => {
                  const score = character.abilities[ab];
                  const mod = abilityModifier(score);

                  return (
                    <div key={ab} className="print-ability-block">
                      <div className="print-ability-label">{ABILITY_LABELS[ab].slice(0, 3)}</div>
                      <div className="print-ability-score">{score}</div>
                      <div className="print-ability-mod">{formatModifier(mod)}</div>
                    </div>
                  );
                })}
              </div>

              <h3 className="print-section-title" style={{ marginTop: '0.75rem' }}>
                {t.savingThrows}
              </h3>
              <div className="print-saves">
                {ABILITY_NAMES.map((ab) => {
                  const bonus = calcSavingThrow(character, ab);
                  const isProficient = character.savingThrowProficiencies.includes(ab);

                  return (
                    <div key={ab} className="print-save-row">
                      <span className={`print-dot ${isProficient ? 'filled' : ''}`} />
                      <span className="print-save-name">{ABILITY_LABELS[ab]}</span>
                      <span className="print-save-bonus">{formatModifier(bonus)}</span>
                    </div>
                  );
                })}
              </div>

              {character.languages?.length > 0 && (
                <>
                  <h3 className="print-section-title" style={{ marginTop: '0.75rem' }}>
                    {t.languages}
                  </h3>
                  <p className="print-tags">{character.languages.map(l => translateApiTerm(t, 'languages', l)).join(', ')}</p>
                </>
              )}
            </div>

            <div>
              <h3 className="print-section-title">{t.skills}</h3>
              <div className="print-skills">
                {character.skills.map((skill) => {
                  const bonus = calcSkillBonus(character, skill.name);
                  const ab = SKILL_ABILITY_MAP[skill.name].toUpperCase();

                  return (
                    <div key={skill.name} className="print-skill-row">
                      <span className={`print-dot ${skill.proficient ? 'filled' : ''}`} />
                      {skill.expertise && (
                        <span className="print-dot filled" style={{ marginLeft: '-6px' }} />
                      )}
                      <span className="print-skill-name">
                        {SKILL_LABELS[skill.name]} <span className="print-skill-ab">({ab})</span>
                      </span>
                      <span className="print-skill-bonus">{formatModifier(bonus)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {character.weapons?.length > 0 && (
            <>
              <div className="print-divider" />
              <h3 className="print-section-title">{t.weapons}</h3>
              <table className="print-table">
                <thead>
                  <tr>
                    <th>{t.weaponName}</th>
                    <th>{t.atkBonus}</th>
                    <th>{t.damage}</th>
                    <th>{t.damageType}</th>
                  </tr>
                </thead>
                <tbody>
                  {character.weapons.map((w) => (
                    <tr key={w.id}>
                      <td>{w.name}</td>
                      <td>{formatModifier(w.attackBonus)}</td>
                      <td>{w.damage}</td>
                      <td>{w.damageType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {character.conditions?.length > 0 && (
            <>
              <div className="print-divider" />
              <h3 className="print-section-title">{t.conditions}</h3>
              <p className="print-tags">{character.conditions.map(c => translateApiTerm(t, 'conditions', c)).join(', ')}</p>
            </>
          )}
        </div>
      </div>

      <div className="print-page">
        <section>
          <h3 className="print-section-title">{t.spellcasting}</h3>

          {character.spellcastingAbility ? (
            <>
              <div className="print-combat-row" style={{ marginBottom: '0.5rem' }}>
                <div className="print-combat-stat">
                  <div className="print-combat-value">
                    {ABILITY_LABELS[character.spellcastingAbility]}
                  </div>
                  <div className="print-combat-label">{t.ability}</div>
                </div>

                <div className="print-combat-stat">
                  <div className="print-combat-value">{dc}</div>
                  <div className="print-combat-label">{t.saveDC}</div>
                </div>

                <div className="print-combat-stat">
                  <div className="print-combat-value">{formatModifier(atk)}</div>
                  <div className="print-combat-label">{t.attackBonus}</div>
                </div>
              </div>

              {Object.keys(character.spellSlots || {}).length > 0 && (
                <div className="print-slot-row">
                  {Object.entries(character.spellSlots)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([lvl, slot]) => (
                      <div key={lvl} className="print-slot">
                        <div className="print-slot-label">{t.spellLevel(Number(lvl))}</div>
                        <div className="print-slot-value">
                          {slot.max - slot.used}/{slot.max}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
                const spells = character.spells.filter((s) => s.level === lvl);
                if (spells.length === 0) return null;

                return (
                  <div key={lvl} style={{ marginBottom: '0.5rem' }}>
                    <h4 className="print-subsection-title">
                      {lvl === 0 ? t.cantrips : t.spellLevel(lvl)}
                    </h4>

                    <div className="print-spell-list">
                      {spells.map((s) => (
                        <div key={s.id} className="print-spell-row">
                          <span className={`print-dot ${s.isPrepared ? 'filled' : ''}`} />
                          <div>
                            <span className="print-spell-name">{s.name}</span>
                            <span className="print-spell-meta">
                              {translateApiTerm(t, 'schools', s.school)} · {s.castingTime} · {s.range}
                            </span>
                            {s.description && (
                              <div className="print-spell-description">{s.description}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">{t.noSpellcasting}</p>
          )}
        </section>

        <div className="print-divider" />

        <section>
          <h3 className="print-section-title">
            {t.currency}: {character.currency.cp} cp · {character.currency.sp} sp · {character.currency.ep} ep · {character.currency.gp} gp · {character.currency.pp} pp
          </h3>

          {character.inventory?.length > 0 ? (
            <table className="print-table">
              <thead>
                <tr>
                  <th>{t.itemName}</th>
                  <th>{t.quantity}</th>
                  <th>{t.weight}</th>
                  <th>{t.description}</th>
                </tr>
              </thead>
              <tbody>
                {character.inventory.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.name}
                      {item.isMagical ? ' ✦' : ''}
                      {item.isEquipped ? ' ●' : ''}
                    </td>
                    <td>{item.quantity}</td>
                    <td>{item.weight > 0 ? `${item.weight} lb` : '—'}</td>
                    <td>{item.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted-foreground text-sm">{t.noItems}</p>
          )}
        </section>
      </div>

      <div className="print-page">
        {character.features?.length > 0 && (
          <div className="print-section">
            <h3 className="print-section-title">{t.tabFeatures}</h3>
            {character.features.map((f) => (
              <div key={f.id} className="print-feature">
                <div className="print-feature-name">
                  {f.name} <span className="print-feature-source">({f.source})</span>
                  {f.usesMax > 0 && (
                    <span className="print-feature-uses">
                      {' '}· {f.usesCurrent}/{f.usesMax}
                    </span>
                  )}
                </div>
                {f.description && <p className="print-feature-desc">{f.description}</p>}
              </div>
            ))}
          </div>
        )}

        {character.feats?.length > 0 && (
          <div className="print-section">
            <h3 className="print-section-title">{t.feats}</h3>
            <p className="print-tags">{character.feats.join(', ')}</p>
          </div>
        )}

        <div className="print-two-col">
          <div>
            <h3 className="print-section-title">{t.appearance}</h3>
            <div className="print-appearance-grid">
              <PrintField label={t.age} value={character.age} />
              <PrintField label={t.height} value={character.height} />
              <PrintField label={t.weightLabel} value={character.weight} />
              <PrintField label={t.eyes} value={character.eyes} />
              <PrintField label={t.skin} value={character.skin} />
              <PrintField label={t.hair} value={character.hair} />
              <PrintField label={t.deity} value={character.deity} />
              <PrintField label={t.faction} value={character.faction} />
            </div>

            {character.appearanceNotes && (
              <p className="print-block-text" style={{ marginTop: '0.5rem' }}>
                {character.appearanceNotes}
              </p>
            )}
          </div>

          <div>
            {character.personalityTraits && (
              <PrintBlock title={t.personalityTraits} text={character.personalityTraits} />
            )}
            {character.ideals && <PrintBlock title={t.ideals} text={character.ideals} />}
            {character.bonds && <PrintBlock title={t.bonds} text={character.bonds} />}
            {character.flaws && <PrintBlock title={t.flaws} text={character.flaws} />}
          </div>
        </div>

        {character.backstory && (
          <>
            <div className="print-divider" />
            <h3 className="print-section-title">{t.backstory}</h3>
            <p className="print-block-text">{character.backstory}</p>
          </>
        )}

        {character.notes && (
          <>
            <div className="print-divider" />
            <h3 className="print-section-title">{t.quickNotes}</h3>
            <p className="print-block-text">{character.notes}</p>
          </>
        )}
      </div>
    </div>
  );
}

function PrintField({ label, value }: PrintFieldProps) {
  return (
    <div className="print-field">
      <span className="print-field-label">{label}</span>
      <span className="print-field-value">{value || '—'}</span>
    </div>
  );
}

function PrintBlock({ title, text }: PrintBlockProps) {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <h4 className="print-subsection-title">{title}</h4>
      <p className="print-block-text">{text || '—'}</p>
    </div>
  );
}