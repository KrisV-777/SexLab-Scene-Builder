import { useState, useEffect } from "react";
import { Card, Space, InputNumber, Divider, Tooltip } from "antd";
import { useImmer } from "use-immer";
import CheckboxEx from "../components/CheckboxEx";
import RaceSelect from "../components/RaceSelect";

// TODO: This likely needs to be arranged a little better

function ScenePosition({ position, onChange }) {
  const [sex, updateSex] = useImmer(position.sex);
  const [race, setRace] = useState(position.race);
  const [scale, setScale] = useState(position.scale);
  const [extra, updateExtra] = useImmer({ submissive: position.submissive, vampire: position.vampire, dead: position.dead, });

  useEffect(() => {
    onChange({
      sex,
      race,
      scale,
      submissive: extra.submissive,
      vampire: extra.vampire,
      dead: extra.dead,
    });
  }, [sex, race, scale, extra]);

  return (
    <Card>
      <Space direction="vertical">
        <Space size={'large'} justify={'space-between'}>
          <RaceSelect
            race={race}
            onSelect={(e) => {
              if (e !== 'Human') {
                updateSex((prev) => {
                  prev.futa = false;
                });
              }
              setRace(e);
            }}
          />
          <Space.Compact>
            <CheckboxEx
              obj={sex}
              label={'Male'}
              attr={'male'}
              updateFunc={updateSex}
            />
            <CheckboxEx
              obj={sex}
              label={'Female'}
              attr={'female'}
              updateFunc={updateSex}
            />
            <CheckboxEx
              obj={sex}
              label={'Futa'}
              disabled={race !== 'Human'}
              attr={'futa'}
              updateFunc={updateSex}
            />
          </Space.Compact>
        </Space>
        <Divider size="small" />
        <Space justify={'space-between'}>
          <Space.Compact>
            <Tooltip title={'Passive/Taker/Bottom position.'}>
              <div>
                <CheckboxEx
                  obj={extra}
                  label={'Submissive'}
                  attr={'submissive'}
                  updateFunc={updateExtra}
                />
              </div>
            </Tooltip>
            <Tooltip className="tool-tip" title={'Actor is a vampire.'}>
              <div>
                <CheckboxEx
                  obj={extra}
                  label={'Vampire'}
                  attr={'vampire'}
                  disabled={race !== 'Human'}
                  updateFunc={updateExtra}
                />
              </div>
            </Tooltip>
            <Tooltip className="tool-tip" title={'Actor is unconscious/dead.'}>
              <div>
                <CheckboxEx
                  obj={extra}
                  label={'Unconscious'}
                  attr={'dead'}
                  updateFunc={updateExtra}
                />
              </div>
            </Tooltip>
          </Space.Compact>
        </Space>
        <Divider size="small" />
        <InputNumber
          addonBefore={'Factor'}
          controls
          decimalSeparator=","
          precision={2}
          min={0.01}
          max={2}
          step={0.01}
          value={scale}
          onChange={(e) => {
            setScale(e);
          }}
          placeholder="1.0"
        />
      </Space>
    </Card>
  );
};

export default ScenePosition;
