import React, { useState } from "react";
import { Button, Card, Checkbox, Col, Input, Row, Select, Space, Tooltip, InputNumber, Dropdown } from "antd";
import RaceSelect from "../components/RaceSelect";
import './PositionField.css'

const stripOptions = [
  "Default",
  "Everything",
  "Nothing",
  "Helmet",
  "Gloves",
  "Boots",
];
const stripKeyMap = {
  default: "Default",
  everything: "Everything",
  nothing: "Nothing",
  helmet: "Helmet",
  gloves: "Gloves",
  boots: "Boots",
};
const uniqueOptionIndex = 3

const getStrips = (list = {}) => {
  const ret = Object.entries(stripKeyMap)
    .filter(([key]) => list[key])
    .map(([, label]) => label);
  return ret.length ? ret : [stripOptions[0]];
};

const makeStrips = (list = []) => {
  const lowerList = list.map(String);
  return Object.fromEntries(
    Object.entries(stripKeyMap).map(([key, label]) => [key, lowerList.includes(label)])
  );
};

function PositionField({ position, info, onChange }) {
  const [basicAnim, setBasicAnim] = useState(true);
  const [workingAnim, setWorkingAnim] = useState(undefined);
  const [sequenceOpen, setSequenceOpen] = useState(false);

  const makeSequenceMenu = (events) => {
    let sequences = [];
    for (let i = 1; i < events.length; i++) {
      sequences.push({
        key: i,
        label: (
          <Input
            addonAfter={'.hkx'}
            addonBefore={'+'}
            value={position.event[i]}
            onChange={(e) => {
              let evt = [...position.event];
              if (!e.target.value) evt.splice(i, 1);
              else evt[i] = e.target.value;
              onChange({ ...position, event: evt }, info);
            }}
          />
        ),
      });
    }
    sequences.push({
      key: 'new',
      label: (
        <Space>
          <Input
            addonAfter={'.hkx'}
            addonBefore={'+'}
            value={workingAnim}
            onChange={(e) => {
              setWorkingAnim(e.target.value);
            }}
            placeholder="New Behavior File"
            onPressEnter={() => {
              onChange({ ...position, event: [...workingAnim, workingAnim] }, info);
              setWorkingAnim(undefined);
            }}
          />
          <Button
            onClick={() => {
              onChange({ ...position, event: [...workingAnim, workingAnim] }, info);
              setWorkingAnim(undefined);
            }}
          >
            Add
          </Button>
        </Space>
      ),
    });
    return sequences;
  }

  return (
    <div>
      <Row gutter={[2, 2]}>
        <Col span={8}> {/* Race */}
          <Card className="position-attribute-card" title={'Race'}>
            <RaceSelect
              race={info.race}
              onSelect={(e) => {
                onChange(position, { ...info, race: e, sex: { ...info.sex, futa: e === 'Human' && info.sex.futa } });
              }}
            />
          </Card>
        </Col>
        <Col span={9}> {/* Sex */}
          <Card
            className="position-attribute-card"
            title={'Sex'}
            extra={
              <Tooltip className="tool-tip"
                title={
                  'The sexes compatible with this position. Tick all that apply.'
                }
              >
                <Button type="link">Info</Button>
              </Tooltip>
            }
          >
            <Space size={'large'} wrap={true}>
              {['male', 'female', 'futa'].map(attr => (
                <Checkbox
                  key={attr}
                  onChange={e => onChange(position, { ...info, sex: { ...info.sex, [attr]: e.target.checked, } })}
                  disabled={attr === 'futa' && info.race !== 'Human'}
                  checked={info.sex[attr]}
                >
                  {attr.charAt(0).toUpperCase() + attr.slice(1)}
                </Checkbox>
              ))}
            </Space>
          </Card>
        </Col>
        <Col span={24}>  {/* Animation (Basic) */}
          <Card
            className="position-attribute-card"
            title={
              <Checkbox
                checked={basicAnim}
                onClick={(e) => setBasicAnim(e.target.checked)}
              >
                Animation {basicAnim ? '(Basic)' : '(Sequence)'}
              </Checkbox>
            }
            extra={
              <Tooltip className="tool-tip"
                title={
                  'The behavior file (.hkx) describing the animation for this position. Without extension.'
                }
              >
                <Button type="link">Info</Button>
              </Tooltip>
            }
          >
            {basicAnim ? (
              <Input
                addonAfter={'.hkx'}
                value={position.event[0]}
                onChange={(e) => {
                  onChange({ ...position, event: [e.target.value] }, info)
                }}
                placeholder="Behavior file"
              />
            ) : (
              <Dropdown
                menu={{
                  overlayClassName: 'test12334',
                  items: makeSequenceMenu(position.event),
                }}
                onOpenChange={(open) => setSequenceOpen(open)}
                open={sequenceOpen}
              >
                <Input
                  addonBefore={'s'}
                  addonAfter={'.hkx'}
                  value={position.event[0]}
                  onChange={(e) => {
                    onChange({ ...position, event: [e.target.value, ...position.event.slice(1)] }, info)
                  }}
                  placeholder="Behavior file"
                />
              </Dropdown>
            )}
          </Card>
        </Col>
        <Col span={24}> {/* Anim Object */}
          {/* behavior file */}
          <Card
            className="position-attribute-card"
            title={'Anim Object'}
            extra={
              <Tooltip className="tool-tip"
                title={
                  'The anim object/s associated with this position. If multiple, separate with commas (,)'
                }
              >
                <Button type="link">Info</Button>
              </Tooltip>
            }
          >
            <Input
              value={position.anim_obj}
              onChange={(e) => {
                onChange({ ...position, anim_obj: [e.target.value] }, info)
              }}
              placeholder="Editor ID"
            />
          </Card>
        </Col>
        <Col xs={12} lg={12} xl={6}> {/* Data */}
          <Card
            className="position-attribute-card"
            title={'Data'}
            extra={
              <Tooltip className="tool-tip"
                title={
                  'Extra Data used to further specify the actor filling this position. Hover options for more info.'
                }
              >
                <Button type="link">Info</Button>
              </Tooltip>
            }
          >
            <Row gutter={[8, 16]} justify={'space-between'}>
              {[
                { attr: 'submissive', title: 'Passive/Taker/Bottom position.' },
                { attr: 'vampire', title: 'Actor is a vampire.' },
                { attr: 'dead', title: 'Actor is unconscious/dead.' },
              ].map(({ attr, title }) => (
                <Col key={attr}>
                  <Tooltip title={title}>
                    {/* div here is necessary to avoid 'findDOMNode is depreciated' error */}
                    <div>
                      <Checkbox
                        onChange={e => onChange(
                          position,
                          { ...info, [attr]: e.target.checked }
                        )}
                        checked={info[attr]}
                      >
                        {attr.charAt(0).toUpperCase() + attr.slice(1)}
                      </Checkbox>
                    </div>
                  </Tooltip>
                </Col>
              ))}
              <Col>
                <Tooltip className="tool-tip" title={'Actor climaxes during this stage.'}>
                  <div>
                    <Checkbox
                      checked={position.climax}
                      onChange={(e) => onChange({ ...position, climax: e.target.checked }, info)}
                    >
                      Climax
                    </Checkbox>
                  </div>
                </Tooltip>
              </Col>
              <Select
                mode="tags"
                style={{ width: '100%' }}
                value={position.tags ? position.tags : undefined}
                placeholder="Tags"
                onSelect={(value) => {
                  const upperV = value.toUpperCase();
                  const idx = position.tags.findIndex(it => it.toUpperCase() === upperV);
                  if (idx === -1) {
                    onChange({ ...position, tags: [...(position.tags || []), value] }, info);
                  }
                }}
                onDeselect={(value) => {
                  const upperV = value.toUpperCase();
                  onChange({ ...position, tags: position.tags.filter(it => it.toUpperCase() !== upperV) }, info);
                }}
                maxTagTextLength={10}
                maxTagCount={3}
              />
            </Row>
          </Card>
        </Col>
        <Col xs={12} lg={12} xl={6}> {/* Offset */}
          <Card
            className="position-attribute-card"
            title={'Offset'}
            extra={
              <Tooltip className="tool-tip"
                title={'The position offset relative to animation center.'}
              >
                <Button type="link">Info</Button>
              </Tooltip>
            }
          >
            <Row gutter={[12, 12]}>
              {['x', 'y', 'z', 'r'].map((axis, index) => (
                <Col span={12} key={index}>
                  <InputNumber
                    addonBefore={axis.toUpperCase()}
                    controls
                    decimalSeparator=","
                    precision={1}
                    step={0.1}
                    value={position.offset[axis] ? position.offset[axis] : undefined}
                    onChange={(e) => {
                      onChange({ ...position, offset: { ...position.offset, [axis]: e ? e : 0.0 } }, info);
                    }}
                    placeholder="0.0"
                    min={axis === 'r' ? 0.0 : undefined}
                    max={axis === 'r' ? 359.9 : undefined}
                  />
                </Col>))}
            </Row>
          </Card>
        </Col>
        <Col xs={12} lg={12} xl={6}> {/* Scale */}
          <Card
            className="position-attribute-card"
            title={'Scale'}
            extra={
              <Tooltip className="tool-tip"
                title={
                  'The desired scale of this actor. Usually the same scale used in the creation of the behavior file.'
                }
              >
                <Button type="link">Info</Button>
              </Tooltip>
            }
          >
            <InputNumber
              addonBefore={'Factor'}
              controls
              decimalSeparator=","
              precision={2}
              min={0.01}
              max={2}
              step={0.01}
              value={info.scale}
              onChange={(e) => {
                onChange(position, { ...info, scale: e });
              }}
              placeholder="1.0"
            />
          </Card>
        </Col>
        <Col xs={12} lg={12} xl={6}> {/* Stripping */}
          <Card
            className="position-attribute-card"
            title={'Stripping'}
            extra={
              <Tooltip className="tool-tip"
                title={'The items this position should strip in this stage.'}
              >
                <Button type="link">Info</Button>
              </Tooltip>
            }
          >
            <Select
              className="position-strip-tree"
              mode="multiple"
              value={getStrips(position.strip_data)}
              options={[
                {
                  label: 'Unique',
                  options: [
                    { label: stripOptions[0], value: stripOptions[0] },
                    { label: stripOptions[1], value: stripOptions[1] },
                    { label: stripOptions[2], value: stripOptions[2] },
                  ],
                },
                {
                  label: 'Multiple',
                  options: [
                    { label: stripOptions[3], value: stripOptions[3] },
                    { label: stripOptions[4], value: stripOptions[4] },
                    { label: stripOptions[5], value: stripOptions[5] },
                  ],
                },
              ]}
              maxTagTextLength={7}
              maxTagCount={3}
              onSelect={(value) => {
                if (stripOptions.indexOf(value) < uniqueOptionIndex) {
                  onChange({ ...position, strip_data: makeStrips([value]) }, info);
                } else {
                  const strips = getStrips(position.strip_data);
                  if (stripOptions.some((v, i) => i < uniqueOptionIndex && strips.includes(v)))
                    onChange({ ...position, strip_data: makeStrips([value]) }, info);
                  else
                    onChange({ ...position, strip_data: makeStrips([...strips, value]) }, info);
                }
              }}
              onDeselect={(value) => {
                let newValue = makeStrips(getStrips(position.strip_data).filter((it) => it !== value));
                onChange({ ...position, strip_data: newValue.length ? newValue : [stripOptions[0]] }, info);
              }}
            />
          </Card>
        </Col>
      </Row>
    </div >
  );
};

export default PositionField;
