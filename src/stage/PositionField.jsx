import React, { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { Button, Card, Checkbox, Col, Input, Row, Select, Space, Tooltip, InputNumber } from "antd";
import { invoke } from "@tauri-apps/api";
import { useImmer } from "use-immer";
import './PositionField.css'

const StripOptions = [
  "Default",
  "Everything",
  "Nothing",
  "Helmet",
  "Gloves",
  "Boots",
];
const getStrips = (list) => {
  let ret = [];
  for (const [key, value] of Object.entries(list)) {
    if (!value)
      continue;

    switch (key) {
      case 'default':
        ret.push(StripOptions[0]);
        break;
      case 'everything':
        ret.push(StripOptions[1]);
        break;
      case 'nothing':
        ret.push(StripOptions[2]);
        break;
      case 'helmet':
        ret.push(StripOptions[3]);
        break;
      case 'gloves':
        ret.push(StripOptions[4]);
        break;
      case 'boots:':
        ret.push(StripOptions[5]);
        break;
    }
  }
  return ret.length ? ret : [StripOptions[0]];
};
const makeStrips = (list) => {
  return {
    default: list.includes(StripOptions[0]),
    everything: list.includes(StripOptions[1]),
    nothing: list.includes(StripOptions[2]),
    helmet: list.includes(StripOptions[3]),
    gloves: list.includes(StripOptions[4]),
    boots: list.includes(StripOptions[5]),
  }
};

const PositionField = forwardRef(function PositionField({ _position, _control }, ref) {
  const [event, setEvent] = useState(_position.event);
  const [race, setRace] = useState(_control && _control.race || _position.race);
  const [sex, updateSex] = useImmer(_control && _control.sex || _position.sex);
  const [extra, updateExtra] = useImmer(_control && _control.extra ? { ..._control.extra, climax: false } : _position.extra);
  const [offset, updateOffset] = useImmer(_control && _control.offset || _position.offset);
  const [scale, setScale] = useState(_control && _control.scale || _position.scale);
  const [anim_obj, setAnimObj] = useState(_position.anim_obj);
  const [strips, updateStrips] = useImmer(getStrips(_control && _control.strip_data || _position.strip_data))
  const [raceKeys, setRaceKeys] = useState([]);

  useEffect(() => {
    invoke('get_race_keys').then(result => setRaceKeys(result));
  }, []);

  useImperativeHandle(ref, () => {
    return {
      getData() {
        return {
          event,
          race,
          sex,
          scale,
          extra,
          offset,
          anim_obj,
          strip_data: makeStrips(strips),
        };
      }
    };
  });

  function CheckboxEx({ obj, label, disabled, attr, updateFunc }) {
    return (
      <Checkbox
        onChange={(e) => { updateFunc(prev => { prev[attr] = e.target.checked }) }}
        checked={obj[attr] && !disabled}
        disabled={disabled || false}
      >
        {label}
      </Checkbox>
    );
  }

  return (
    <div>
      <Row gutter={[2, 2]}>
        <Col span={8}>
          {/* Race */}
          <Card className="position-attribute-card" title={'Race'}>
            <Select
              className='position-race-select'
              defaultValue={race}
              disabled={!!_control}
              showSearch
              placeholder="Position race"
              optionFilterProp="children"
              filterOption={(input, option) => (option?.label ?? '').includes(input)}
              filterSort={(optionA, optionB) =>
                (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
              }
              options={raceKeys.map((race, i) => { return { value: race, label: race } })}
              onSelect={(e) => { setRace(e) }}
            />
          </Card>
        </Col>
        <Col span={8}>
          {/* Sex */}
          <Card className="position-attribute-card" title={"Sex"}
            extra={<Tooltip title={'The sexes compatible with this position. Tick all that apply.'}><Button type="link">Info</Button></Tooltip>}
          >
            <Space size={'large'}>
              <CheckboxEx obj={sex} label={'Male'} attr={'male'} updateFunc={updateSex} />
              <CheckboxEx obj={sex} label={'Female'} attr={'female'} updateFunc={updateSex} />
              <CheckboxEx obj={sex} label={'Futa'} disabled={race !== 'Human'} attr={'futa'} updateFunc={updateSex} />
            </Space>
          </Card>
        </Col>
        <Col span={8}>
          {/* behavior file */}
          <Card className="position-attribute-card" title={'Animation'}
            extra={<Tooltip title={'The behavior file (.hkx) describing the animation for this position. Without extension.'}><Button type="link">Info</Button></Tooltip>}>
            <Input addonAfter={'.hkx'}
              value={event} onChange={(e) => { setEvent(e.target.value) }}
              placeholder="Behavior file"
            />
          </Card>
        </Col>

        <Col span={12}>
          {/* Data */}
          <Card className="position-attribute-card" title={'Data'}
            extra={<Tooltip title={'Extra Data used to further specify the actor filling this position. Hover options for more info.'}><Button type="link">Info</Button></Tooltip>}
          >
            {/* div here is necessary to avoid 'findDOMNode is depreciated' error */}
            <Row gutter={[8, 16]} justify={'space-between'}>
              <Col>
                <Tooltip title={'Passive/Taker/Bottom position.'}>
                  <div>
                    <CheckboxEx obj={extra} label={'Submissive'} attr={'submissive'} updateFunc={updateExtra} />
                  </div>
                </Tooltip>
              </Col>
              <Col>
                <Tooltip title={'Actor climaxes during this stage.'}>
                  <div>
                    <Checkbox
                      checked={extra.climax}
                      onChange={(e) => { updateExtra(prev => { prev.climax = e.target.checked }) }}
                    >
                      Climax
                    </Checkbox>
                  </div>
                </Tooltip>
              </Col>
              <Col>
                <Tooltip title={'Actor is a vampire.'}>
                  <div>
                    <CheckboxEx obj={extra} label={'Vampire'} attr={'vampire'} disabled={race !== "Human"} updateFunc={updateExtra} />
                  </div>
                </Tooltip>
              </Col>
              <Col>
                <Tooltip title={'Actor is unconscious/dead.'}>
                  <div>
                    <CheckboxEx obj={extra} label={'Unconscious'} attr={'dead'} updateFunc={updateExtra} />
                  </div>
                </Tooltip>
              </Col>
              <Col>
                <Tooltip title={'Actor is locked in a yoke (not anim object).'}>
                  <div>
                    <CheckboxEx obj={extra} label={'Yoke'} attr={'yoke'} disabled={race !== "Human"} updateFunc={updateExtra} />
                  </div>
                </Tooltip>
              </Col>
              <Col>
                <Tooltip title={'Actor is locked in an armbinder (not anim object).'}>
                  <div>
                    <CheckboxEx obj={extra} label={'Armbinder'} attr={'armbinder'} disabled={race !== "Human"} updateFunc={updateExtra} />
                  </div>
                </Tooltip>
              </Col>
              <Col>
                <Tooltip title={'Actor is locked in a legbinder.'}>
                  <div>
                    <CheckboxEx obj={extra} label={'Legbinder'} attr={'legbinder'} disabled={race !== "Human"} updateFunc={updateExtra} />
                  </div>
                </Tooltip>
              </Col>
              {/* <Col>
                <Tooltip title={'The is wearing a petsuit.'}>
                  <div>
                    <CheckboxEx obj={extra} label={'Petsuit'} attr={'petsuit'} disabled={race !== "Human"} updateFunc={updateExtra} />
                  </div>
                </Tooltip>
              </Col> */}
              <Col>
                <Tooltip title={'The position is not required for the scene to player properly (Bystander).'}>
                  <div>
                    <CheckboxEx obj={extra} label={'Optional'} attr={'optional'} updateFunc={updateExtra} />
                  </div>
                </Tooltip>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          {/* Offset */}
          <Card className="position-attribute-card" title={'Offset'}
            extra={<Tooltip title={'The position offset relative to animation center.'}><Button type="link">Info</Button></Tooltip>}
          >
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <InputNumber addonBefore={'X'} controls decimalSeparator="," precision={1} step={0.1}
                  value={offset.x ? offset.x : undefined} onChange={(e) => { updateOffset(prev => { prev.x = e }) }}
                  placeholder="0.0"
                />
              </Col>
              <Col span={12}>
                <InputNumber addonBefore={'Y'} controls decimalSeparator="," precision={1} step={0.1}
                  value={offset.y ? offset.y : undefined} onChange={(e) => { updateOffset(prev => { prev.y = e }) }}
                  placeholder="0.0"
                />
              </Col>
              <Col span={12}>
                <InputNumber addonBefore={'Z'} controls decimalSeparator="," precision={1} step={0.1}
                  value={offset.z ? offset.z : undefined} onChange={(e) => { updateOffset(prev => { prev.z = e }) }}
                  placeholder="0.0"
                />
              </Col>
              <Col span={12}>
                <InputNumber addonBefore={'°'} controls decimalSeparator="," precision={1} step={0.1} min={0.0} max={359.9}
                  value={offset.rot ? offset.rot : undefined} onChange={(e) => { updateOffset(prev => { prev.rot = e }) }}
                  placeholder="0.0"
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="position-attribute-card" title={'Scale'}
            extra={<Tooltip title={'The desired scale of this actor. Usually the same scale used in the creation of the behavior file.'}><Button type="link">Info</Button></Tooltip>}
          >
            <InputNumber addonBefore={'Factor'} controls decimalSeparator=","
              precision={2} min={0.01} max={2} step={0.01}
              value={scale} onChange={(e) => { setScale(e) }}
              placeholder="1.0"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="position-attribute-card" title={'Stripping'}
            extra={<Tooltip title={'The items this position should strip in this stage.'}><Button type="link">Info</Button></Tooltip>}
          >
            <Select 
              className="position-strip-tree"
              mode="multiple"
              value={strips}
              options={[
                {
                  label: 'Unique',
                  options: [
                    { label: StripOptions[0], value: StripOptions[0] },
                    { label: StripOptions[1], value: StripOptions[1] },
                    { label: StripOptions[2], value: StripOptions[2] },
                  ],
                },
                {
                  label: 'Multiple',
                  options: [
                    { label: StripOptions[3], value: StripOptions[3] },
                    { label: StripOptions[4], value: StripOptions[4] },
                    { label: StripOptions[5], value: StripOptions[5] },
                  ],
                },
              ]}
              maxTagTextLength={7}
              maxTagCount={2}
              onSelect={(value) => {
                if (StripOptions.indexOf(value) < 3) {
                  updateStrips([value]);
                } else {
                  updateStrips(prev => {
                    let where = -1
                    for (let i = 0; i < 3 && where === -1; i++) {
                      where = prev.indexOf(StripOptions[i])
                    }
                    if (where === -1)
                      prev.push(value)
                    else
                      prev[where] = value
                  }); 
                }
              }}
              onDeselect={(value) => {
                updateStrips(prev => {
                  prev = prev.filter(it => it !== value);
                  if (prev.length === 0) {
                    prev = [StripOptions[0]]
                  }
                  return prev;
                })
              }}
            />
          </Card>
        </Col>
        <Col span={8}>
          {/* behavior file */}
          <Card className="position-attribute-card" title={'Anim Object'}
            extra={<Tooltip title={'The anim object/s associated with this position. If multiple, separate with commas (,)'}><Button type="link">Info</Button></Tooltip>}>
            <Input value={anim_obj} onChange={(e) => { setAnimObj(e.target.value) }} placeholder="Editor ID"/>
          </Card>
        </Col>
      </Row>
    </div>
  );
});

export default PositionField;
