import React, { useState, useRef, useEffect } from "react";
import { emit, once } from '@tauri-apps/api/event'
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import ReactDOM from "react-dom/client";
import { useImmer } from "use-immer";
import { AlipaySquareFilled, SaveOutlined } from '@ant-design/icons';
import { Input, Button, Tag, Space, Tooltip, InputNumber, Card, Layout, Divider, Menu, Row, Col, Tabs, TreeSelect, notification, Collapse } from 'antd';

import { tagsSFW, tagsNSFW } from "./common/Tags"
import PositionField from "./stage/PositionField";
import "./stage.css";
import "./Dark.css";

const { Header, Content, Footer, Sider } = Layout;
const { TextArea } = Input;

document.addEventListener('DOMContentLoaded', async () => {
  const load = (payload) => {
    const { stage, control } = payload;
    console.log("Loading stage", payload);
    ReactDOM.createRoot(document.getElementById("root")).render(
      <React.StrictMode>
        <Editor
          _id={stage.id}
          _name={stage.name}
          _positions={stage.positions}
          _tags={stage.tags}
          _extra={stage.extra}
          _control={control}
        />
      </React.StrictMode>
    );
  }
  const stagestr = window.sessionStorage.getItem('origin_data');
  if (stagestr) {
    const payload = await JSON.parse(stagestr);
    load(payload);
    return;
  }
  // Send Event to backend that the dom is loaded and wait for it to send the window data
  once('on_data_received', ({ payload }) => {
    window.sessionStorage.setItem('origin_data', JSON.stringify(payload));
    load(payload);
  }).then(f => f());
  await emit('on_request_data');
});

function makePositionTab(p, i) {
  return { key: `PTab${i}`, position: p }
}

function Editor({ _id, _name, _positions, _tags, _extra, _control }) {
  const [api, contextHolder] = notification.useNotification();
  // Name
  const [name, setName] = useState(_name);
  // Positions
  const [positions, updatePositions] = useImmer(_positions.map((p, i) => { return makePositionTab(p, i) }));
  const [activePosition, setActivePosition] = useState(positions[0].key);
  const positionRefs = useRef([]);
  const positionIdx = useRef(_positions.length);
  // Tags
  const [tagTree, updateTagTree] = useImmer([
    {
      value: "tagsSFW",
      title: "SFW",
      selectable: false,
      children: tagsSFW.map(tag => {
        return {
          value: tag,
          title: tag,
        }
      }),
    },
    {
      value: "tagsNSFW",
      title: "NSFW",
      selectable: false,
      children: tagsNSFW.map(tag => {
        return {
          value: tag,
          title: tag,
        }
      }),
    },
  ]);
  const [tags, updateTags] = useImmer(_tags || []);
  const [customTag, setCustomTag] = useState('');
  // Extra
  const [fixedLen, setFixedLen] = useState(_extra.fixed_len);
  const [navText, setNavText] = useState(_extra.nav_text);

  useEffect(() => {
    const toggleDarkMode = (toEnabled) => {
      const root = document.getElementById('root');

      if (toEnabled) {
        root.classList.add('dark-mode');
      } else {
        root.classList.remove('dark-mode');
      }
    }

    invoke('get_in_darkmode').then(ret => toggleDarkMode(ret));
    const unlisten = listen('toggle_darkmode', (event) => {
      toggleDarkMode(event.payload);
    });
    return () => {
      unlisten.then(res => { res() });
    }
  }, []);

  function saveAndReturn() {
    let errors = false;
    let position_arg = [];
    positions.forEach((p, i) => {
      let arg = positionRefs.current[i] ?
        positionRefs.current[i].getData() :
        p.position;

      if (!arg.event.length || !arg.event[0]) {
        api['error']({
          message: 'Missing Event',
          description: `Position ${i + 1} is missing its behavior file (.hkx)`,
          placement: 'bottomLeft',
        });
        errors = true;
      }
      if (!arg.sex.male && !arg.sex.female && !arg.sex.futa) {
        api['error']({
          message: 'Missing Sex',
          description: `Position ${i + 1} has no sex assigned. Every position should be compatible with at least one sex.`,
          placement: 'bottomLeft',
        });
        errors = true;
      }

      position_arg.push(arg);
    });

    if (errors)
      return;

    const stage = {
      id: _id,
      name,
      positions: position_arg,
      tags,
      extra: {
        fixed_len: fixedLen || 0.0,
        nav_text: navText || '',
      },
    };
    // console.log(stage);
    invoke('stage_save_and_close', { stage });
  }

  const onPositionTabEdit = (targetKey, action) => {
    if (action === 'add') {
      invoke('make_position').then((res) => {
        const next = makePositionTab(res, positionIdx.current++);
        updatePositions(p => { p.push(next) });
        setActivePosition(next.key);
      });
    } else {
      const id = positions.findIndex(v => v.key === targetKey);
      if (activePosition === targetKey) {
        const newidx = id > 0 ? id - 1 : 1;
        setActivePosition(positions[newidx].key);
      }
      updatePositions(p => { p.splice(id, 1) });
      if (positionRefs.current[id]) {
        positionRefs.current.splice(id, 1);
      }
    }
  };

  const addCustomTags = () => {
    const add = customTag.split(',');
    updateTags(prev => {
      add.forEach(tag => {
        tag = tag.trim();
        const s = tag.toLowerCase().replace(/\s+/g, '');
        if (!s || tags.find(t => t.toLowerCase().replace(/\s+/g, '') === s))
          return;
        prev.push(tag);
      });
      return prev;
    });
    setCustomTag('');
  }

  const positionsCollapsed = [
    {
      key: '1',
      label: 'Tags',
      children: 
      <>
        <TreeSelect
        className="tag-display-field"
        size="large"
        multiple
        placeholder = "Please Select Tags"
        allowClear
        value={tags}
        onSelect={(e) => {
          updateTags((prev) => {
            prev.push(e);
          });
        }}
        onClear={() => {
          updateTags([]);
        }}
        dropdownRender={(menu) => (
          <>
            {menu}
            <Divider style={{ margin: '8px 0' }} />
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Custom Tag A, Custom Tag B"
                onPressEnter={addCustomTags}
              />
              <Button type="primary" onClick={addCustomTags}>
                Add
              </Button>
            </Space.Compact>
          </>
        )}
        maxTagTextLength={20}
        tagRender={({ label, value, closable, onClose }) => {
          const search = value.toLowerCase();
          let color = tagsSFW.find((it) => it.toLowerCase() === search)
            ? 'cyan'
            : tagsNSFW.find((it) => it.toLowerCase() === search)
            ? 'volcano'
            : undefined;

          const onPreventMouseDown = (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
          };
          const onCloseEx = () => {
            updateTags((prev) => prev.filter((tag) => tag !== value));
            onClose();
          };
          return (
            <Tag
              color={color}
              onMouseDown={onPreventMouseDown}
              closable={closable}
              onClose={onCloseEx}
              style={{ margin: 2 }}
            >
              {label}
            </Tag>
          );
        }}
        treeData={tagTree}
        treeExpandAction={'click'}/>
      </>
    },{
      key: '2',
      label: 'Positions',
      children:
      <Tabs
        type="editable-card"
        activeKey={activePosition}
        hideAdd={positions.length > 4 || !!_control}
        onEdit={onPositionTabEdit}
        onChange={(e) => {
          setActivePosition(e);
        }}
        items={positions.map((p, i) => {
          return {
            label: `Position ${i + 1}`,
            closable: positions.length > 1 && !_control,
            key: p.key,
            children: (

              <div className="position">
                <PositionField
                  _position={p.position}
                  _control={(_control && _control.positions[i]) || null}
                  ref={(element) => {
                    positionRefs.current[i] = element;
                  }}
                />
              </div>
            ),
          };
        })}
      />
    },{
      key: '3',
      label: 'Extra',
      children:
      <>
        <Row gutter={[2, 2]}>
          <Col span={12}>
            <Card
              title={'Navigation'}
              extra={
                <Tooltip
                  title={
                    'A short text for the player to read when given the option to branch into this stage.'
                  }
                >
                  <Button type="link">Info</Button>
                </Tooltip>
              }
            >
              <TextArea
                className="extra-navinfo-textarea"
                maxLength={100}
                showCount
                rows={3}
                style={{ resize: 'none' }}
                defaultValue={_extra.navText}
                value={navText}
                onChange={(e) => setNavText(e.target.value)}
              ></TextArea>
            </Card>
          </Col>
          <Col span={12}>
            <Card
              title={'Fixed Duration'}
              extra={
                <Tooltip
                  title={
                    'Duration of an animation that should only play once (does not loop).'
                  }
                >
                  <Button type="link">Info</Button>
                </Tooltip>
              }
            >
              <Space direction="vertical">
                <InputNumber
                  className="extra-duration-input"
                  controls
                  precision={0}
                  step={10}
                  defaultValue={_extra.fixedLen}
                  min={0}
                  value={fixedLen ? fixedLen : undefined}
                  onChange={(e) => setFixedLen(e)}
                  placeholder="0"
                  addonAfter={'ms'}
                />
              </Space>
            </Card>
          </Col>
        </Row>
      </>

    }
  ]

  return (
    <Layout>
      {contextHolder}
      <Header className="stage-header">
        <Row>
          <Col>
            <Input
              id="stage-namefield-input"
              className="stage-namefield"
              size="large"
              maxLength={30}
              bordered={false}
              value={name}
              onChange={(e) => setName(e.target.value)}
              defaultValue={_name}
              placeholder={'Stage Name'}
              onFocus={(e) => e.target.select()}
            />
          </Col>
          <Col flex={'auto'}>
            <Menu
              className="stage-header-menu"
              theme="dark"
              mode="horizontal"
              selectable={false}
              defaultSelectedKeys={['save']}
              onClick={({ key }) => {
                switch (key) {
                  case 'save':
                    saveAndReturn();
                    break;
                }
              }}
              items={[
                { type: 'divider' },
                {
                  label: 'Save',
                  key: 'save',
                  icon: <SaveOutlined />,
                  className: 'stage-header-menu-entry',
                },
              ]}
            />
          </Col>
        </Row>
      </Header>
      <Collapse items={positionsCollapsed} defaultActiveKey={['1','2','3']} />;
    </Layout>
  );
}

export default Editor;
