import React from 'react';
import { Space, Select, Checkbox, Row, Col, InputNumber } from 'antd';
import { Furnitures } from "../common/Furniture";

function PositionsSidebar({ activeScene, updateActiveScene, setEdited }) {
    return (
      <div className="graph-data-field">
        <Space size={'large'}>
          <Space direction="vertical" size={'large'}>
            <Select
              className="graph-furniture-selection"
              value={
                activeScene ? activeScene.furniture.furni_types : []
              }
              options={Furnitures}
              mode="multiple"
              onSelect={(value) => {
                if (value === 'None') {
                  updateActiveScene((prev) => {
                    prev.furniture.furni_types = [value];
                    return prev;
                  });
                } else {
                  updateActiveScene((prev) => {
                    let where =
                      prev.furniture.furni_types.indexOf('None');
                    if (where === -1)
                      prev.furniture.furni_types.push(value);
                    else
                      prev.furniture.furni_types[where] = value;
                    prev.furniture.allow_bed = false;
                    return prev;
                  });
                }
                setEdited(true);
              }}
              onDeselect={(value) => {
                updateActiveScene((prev) => {
                  prev.furniture.furni_types =
                    prev.furniture.furni_types.filter(
                      (it) => it !== value
                    );
                  if (prev.furniture.furni_types.length === 0) {
                    prev.furniture.furni_types = ['None'];
                  }
                  return prev;
                });
                setEdited(true);
              }}
            />
            <Checkbox
              onChange={(e) => {
                updateActiveScene((prev) => {
                  prev.furniture.allow_bed = e.target.checked;
                });
                setEdited(true);
              }}
              checked={activeScene && activeScene.furniture.allow_bed}
              disabled={
                activeScene &&
                !activeScene.furniture.furni_types.includes('None')
              }
            >
              Allow Bed
            </Checkbox>
            <Checkbox
              onChange={(e) => {
                updateActiveScene((prev) => {
                  prev.private = e.target.checked;
                });
                setEdited(true);
              }}
              checked={activeScene && activeScene.private}
            >
              Private
            </Checkbox>
          </Space>
          <Space>
            <Row gutter={[12, 12]} justify={'space-evenly'}>
              <Col>
                <InputNumber
                  addonBefore={'X'}
                  controls
                  decimalSeparator=","
                  precision={1}
                  step={0.1}
                  value={
                    activeScene
                      ? activeScene.furniture.offset.x
                        ? activeScene.furniture.offset.x
                        : undefined
                      : undefined
                  }
                  onChange={(e) => {
                    updateActiveScene((prev) => {
                      prev.furniture.offset.x = e;
                    });
                    setEdited(true);
                  }}
                  placeholder="0.0"
                />
              </Col>
              <Col>
                <InputNumber
                  addonBefore={'Y'}
                  controls
                  decimalSeparator=","
                  precision={1}
                  step={0.1}
                  value={
                    activeScene && activeScene.furniture.offset.y
                      ? activeScene.furniture.offset.y
                      : undefined
                  }
                  onChange={(e) => {
                    updateActiveScene((prev) => {
                      prev.furniture.offset.y = e;
                    });
                    setEdited(true);
                  }}
                  placeholder="0.0"
                />
              </Col>
              <Col>
                <InputNumber
                  addonBefore={'Z'}
                  controls
                  decimalSeparator=","
                  precision={1}
                  step={0.1}
                  value={
                    activeScene
                      ? activeScene.furniture.offset.z
                        ? activeScene.furniture.offset.z
                        : undefined
                      : undefined
                  }
                  onChange={(e) => {
                    updateActiveScene((prev) => {
                      prev.furniture.offset.z = e;
                    });
                    setEdited(true);
                  }}
                  placeholder="0.0"
                />
              </Col>
              <Col>
                <InputNumber
                  addonBefore={'°'}
                  controls
                  decimalSeparator=","
                  precision={1}
                  step={0.1}
                  min={0.0}
                  max={359.9}
                  value={activeScene && activeScene.furniture.offset.r || undefined}
                  onChange={(e) => {
                    updateActiveScene((prev) => {
                      prev.furniture.offset.r = e;
                    });
                    setEdited(true);
                  }}
                  placeholder="0.0"
                />
              </Col>
            </Row>
          </Space>
        </Space>
      </div>
    );
}
  
export default PositionsSidebar;