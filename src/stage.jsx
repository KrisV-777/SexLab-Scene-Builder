import React, { useState, useRef, useEffect } from "react";
import { emit, once, listen } from '@tauri-apps/api/event'
import { invoke } from "@tauri-apps/api/core"
import ReactDOM from "react-dom/client";
import { useImmer } from "use-immer";
import { AlipaySquareFilled, FileDoneOutlined, TagsOutlined, SaveOutlined, TeamOutlined } from '@ant-design/icons';
import { Input, Button, Tag, Space, Tooltip, InputNumber, Card, Layout, Divider, Menu, Row, Col, Tabs, TreeSelect, notification, Collapse, ConfigProvider, theme } from 'antd';

import { tagsSFW, tagsNSFW } from "./common/Tags"
import PositionField from "./stage/PositionField";
import TagTree from "./components/TagTree";
import "./stage.css";
// import "./Dark.css";

const { Header } = Layout;
const { TextArea } = Input;

// New Dark Mode State


let root = null;
document.addEventListener('DOMContentLoaded', async () => {
  const load = ({ scene, stage, positions }) => {
    console.log("Scene ID:", scene, "Stage:", stage);
    const merged = stage.positions.map((pos, i) => ({ position: pos, info: positions[i] }));
    if (!root) root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(
      <React.StrictMode>
        <Editor
          key={`Editor-${stage.id}`}
          _sceneId={scene}
          _stage={stage}
          _positions={merged}
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
  return { key: `PTab${i}`, position: p.position, info: p.info }
}

function Editor({ _sceneId, _stage, _positions }) {
  const [isDark, setIsDark] = useState(false);
  const [api, contextHolder] = notification.useNotification();

  const [name, setName] = useState(_stage.name);
  const [positions, updatePositions] = useImmer(_positions.map((p, i) => { return makePositionTab(p, i) }));
  const [activePosition, setActivePosition] = useState(positions[0].key);
  const positionIdx = useRef(_positions.length);
  const [tags, setTags] = useState(_stage.tags);
  const [fixedLen, setFixedLen] = useState(_stage.extra.fixed_len);
  const [navText, setNavText] = useState(_stage.extra.nav_text);

  useEffect(() => {
    // Listen for the toggle_darkmode event from Tauri
    const unlisten = listen('toggle_darkmode', (event) => {
      setIsDark(event.payload); // event.payload should be true or false
    });
    // Optionally, get initial dark mode state from backend
    invoke('get_in_darkmode').then(setIsDark);
    return () => { unlisten.then(f => f()); };
  }, []);


  useEffect(() => {
    const position_remove = listen('on_position_remove', (event) => {
      const { sceneId, positionIdx } = event.payload;
      if (sceneId !== _sceneId) return;
      updatePositions(p => { p.splice(positionIdx, 1) });
    });
    const position_add = listen('on_position_add', (event) => {
      const { sceneId, position } = event.payload;
      if (sceneId !== _sceneId) return;
      updatePositions(prev => { prev.push(position) });
    });
    const position_change = listen('on_position_change', (event) => {
      const { sceneId, stageId, positionIdx, info } = event.payload;
      if (sceneId !== _sceneId || stageId === _stage.id) return;
      console.log("Position Change Event:", info);
      updatePositions(p => { p[positionIdx].info = info });
    });
    return () => {
      position_remove.then(res => { res() });
      position_add.then(res => { res() });
      position_change.then(res => { res() });
    }
  }, []);

  function saveAndReturn() {
    let positionArg = [];
    let positionsInfo = [];
    for (let i = 0; i < positions.length; i++) {
      const { position: stage_p, info: scene_p } = positions[i];
      if (!stage_p.event[0]) {
        api.error({
          message: 'Missing Event',
          description: `Position ${i + 1} is missing its behavior file (.hkx)`,
          placement: 'bottomLeft',
        });
        return;
      }
      if (!scene_p.sex.male && !scene_p.sex.female && !scene_p.sex.futa) {
        api.error({
          message: 'Missing Sex',
          description: `Position ${i + 1} has no sex assigned. Every position should be compatible with at least one sex.`,
          placement: 'bottomLeft',
        });
        return;
      }
      positionArg.push(stage_p);
      positionsInfo.push(scene_p);
    }
    const stage = {
      id: _stage.id,
      name,
      positions: positionArg,
      tags,
      extra: {
        fixed_len: fixedLen || 0.0,
        nav_text: navText || '',
      },
    };
    console.log("Saving Stage... ", _sceneId, positionsInfo, stage);
    invoke('stage_save_and_close', { scene: _sceneId, positions: positionsInfo, stage });
  }

  const onPositionTabEdit = (targetKey, action) => {
    if (action === 'add') {
      invoke('make_position').then((res) => {
        const next = makePositionTab(res, positionIdx.current++);
        emit('on_position_add', { sceneId: _sceneId, position: next }).then(() => {
          setActivePosition(next.key);
        });
      });
    } else {
      const id = positions.findIndex(v => v.key === targetKey);
      if (activePosition === targetKey) {
        const newidx = id > 0 ? id - 1 : 1;
        setActivePosition(positions[newidx].key);
      }
      emit('on_position_remove', { sceneId: _sceneId, positionIdx: id });
    }
  };

  const positionsCollapsed = [
    { // Tags
      key: '1',
      label: 'Tags',
      extra: <TagsOutlined />,
      children:
        <div className="tag-display-box">
          <TagTree
            tags={tags}
            onChange={setTags}
            tagsSFW={tagsSFW}
            tagsNSFW={tagsNSFW}
          />
        </div>
    },
    { // Positions
      key: '2',
      label: 'Positions',
      extra: <TeamOutlined />,
      children:
        <Tabs
          type="editable-card"
          activeKey={activePosition}
          hideAdd={positions.length > 4}
          onEdit={onPositionTabEdit}
          onChange={(e) => {
            setActivePosition(e);
          }}
          items={positions.map((p, i) => {
            return {
              label: `Position ${i + 1}`,
              closable: positions.length > 1,
              key: p.key,
              children: (
                <div className="position">
                  <PositionField
                    position={p.position}
                    info={p.info}
                    onChange={(newPosition, newInfo) => {
                      updatePositions((draft) => {
                        draft[i].position = newPosition;
                        draft[i].info = newInfo;
                      });
                      emit('on_position_change', {
                        sceneId: _sceneId,
                        stageId: _stage.id,
                        positionIdx: i,
                        info: newInfo,
                      });
                    }}
                  />
                </div>
              ),
            };
          })}
        />
    },
    { //Extra
      key: '3',
      label: 'Extra',
      extra: <FileDoneOutlined />,
      children:
        <>
          <Row gutter={[2, 2]}>
            <Col span={12}>
              <Card
                style={{ height: '100%' }}
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
                  style={{ resize: 'none', width: '100%' }}
                  defaultValue={_stage.extra.navText}
                  value={navText}
                  onChange={(e) => setNavText(e.target.value)}
                ></TextArea>
              </Card>
            </Col>
            <Col span={12}>
              <Card
                style={{ height: '100%' }}
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
                <InputNumber
                  className="extra-duration-input"
                  controls
                  precision={0}
                  step={10}
                  defaultValue={_stage.extra.fixedLen}
                  min={0}
                  value={fixedLen ? fixedLen : undefined}
                  onChange={(e) => setFixedLen(e)}
                  placeholder="0"
                  addonAfter={'ms'}
                  style={{ width: '100%' }}
                />
              </Card>
            </Col>
          </Row>
        </>
    }
  ]

  return (
    <ConfigProvider
      theme={{
      algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: isDark
        ? {
          //Dark Mode Color Overrides
          colorBgBase: '#001529'
        }
      : {
        // Light Mode Color Overrides
      }

    }}
    >
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
                defaultValue={_stage.name}
                placeholder={'Stage Name'}
                onFocus={(e) => e.target.select()}
              />
            </Col>
            <Col flex={'auto'}>
              <Menu
                className="stage-header-menu"
                theme={isDark ? "dark" : "light"}
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
        <Collapse items={positionsCollapsed} defaultActiveKey={['1', '2', '3']} />;
      </Layout>
    </ConfigProvider>
  )
}

export default Editor;
