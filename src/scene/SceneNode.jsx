import { useState } from 'react';
import { Space, Button, Row, Dropdown, Tooltip } from 'antd'
import Icon, { EditOutlined, CopyOutlined, CloseOutlined, WarningOutlined, ArrowRightOutlined, HeartFilled } from '@ant-design/icons';
import { register } from "@antv/x6-react-shape";
import './SceneNode.css'

const NODE_HEIGHT = 100;
const NODE_WIDTH = 180;
const START_COLOR = 'rgb(0, 88, 0)';
const PORT_DEFAULTS = {
  fill: 'rgb(201, 225, 195, 0.3)',
  stroke: 'black',
}

function makeMenuItem(label, key, disabled, danger) {
  return { key, label, disabled, danger };
}

function makeColor(r, g, b, a = 1) {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function FixedLength(props) {
  const fixedLen_svg = () => (
    <svg viewBox="112 176 800 672" width="1em" height="1em" fill="currentColor">
      <path d="M 180 176 h -60 c -4.4 0 -8 3.6 -8 8 v 656 c 0 4.4 3.6 8 8 8 h 60 c 4.4 0 8 -3.6 8 -8 V 184 c 0 -4.4 -3.6 -8 -8 -8 z m 724 0 h -60 c -4.4 0 -8 3.6 -8 8 v 656 c 0 4.4 3.6 8 8 8 h 60 c 4.4 0 8 -3.6 8 -8 V 184 c 0 -4.4 -3.6 -8 -8 -8 z M 785.3 504.3 L 657.7 403.6 a 7.23 7.23 0 0 0 -11.7 5.7 V 476 H 238 V 548 h 407.3 v 62.8 c 0 6 7 9.4 11.7 5.7 l 127.5 -100.8 c 3.8 -2.9 3.8 -8.5 0.2 -11.4 z" />
    </svg>
  );
  return (
    <Icon component={fixedLen_svg} {...props} />
  )
}


function StageNode({ node, graph }) {
  const [hovered, setHover] = useState(false);
  // const ports = graph.findViewByCell(node).container.querySelectorAll('.x6-port-body');

  const stage = node.prop('stage');
  const start = node.prop('isStart');
  const fixedLen = node.prop('fixedLen');

  const label = stage.name;
  const navText = stage.extra.nav_text;
  const orgasm = stage.positions.find(pos => pos.climax) !== undefined;
  const color = fixedLen ?
    fixedLen < 50 ? makeColor(255, 175, 175, 1) :
      makeColor(175, 235, 255, 1)
    : undefined;

  node.prop('ports/groups/default/attrs/path/stroke', start ? START_COLOR : PORT_DEFAULTS.stroke);
  node.prop('ports/groups/default/attrs/path/fill', color ? color : PORT_DEFAULTS.fill);

  const contextItems = [
    makeMenuItem('Edit', 'edit'),
    makeMenuItem('Clone', 'clone'),
    { type: "divider" },
    makeMenuItem('Mark as root', 'makeroot',),
    makeMenuItem('Remove connections', 'removeconnections'),
    { type: "divider" },
    makeMenuItem('Delete', 'remove', false, true),
  ];

  const editStage = () => {
    graph.emit("node:edit", { node });
  }

  const cloneStage = () => {
    graph.emit("node:clone", { node });
  }

  const onContextSelect = ({ key, keyPath, domEvent }) => {
    switch (key) {
      case 'edit':
        editStage();
        break;
      case 'clone':
        cloneStage();
        break;
      case 'makeroot':
        graph.emit("node:doMarkRoot", { node });
        break;
      case 'removeconnections':
        const edges = graph.getConnectedEdges(node);
        edges.forEach(edge => edge.remove());
        break;
      case 'remove':
        node.remove();
        break;
      default:
        console.log("Invalid key selected: ", key);
        break;
    }
  }

  return (
    <Dropdown menu={{ items: contextItems, onClick: onContextSelect }} trigger={['contextMenu']}>
      <div
        onMouseEnter={() => { setHover(true); }}
        onMouseLeave={() => { setHover(false); }}
        className="stage-content"
        style={{
          backgroundColor: color,
          borderColor: start ? START_COLOR : undefined,
        }}>
        <Row className='node-header'>
          <Space className='node-attribute-icons' size={10} wrap={false}>
            {!navText && !start ?
              <Tooltip title={'Missing navigation text'}>
                <WarningOutlined style={{ fontSize: 20, color: makeColor(255, 0, 0) }} />
              </Tooltip> : <></>}
            {start ?
              <Tooltip title={'Start Animation'}>
                <ArrowRightOutlined style={{ fontSize: 20, color: makeColor(17, 175, 17) }} />
              </Tooltip> : <></>}
            {orgasm ?
              <Tooltip title={'Orgasm Stage'}>
                <HeartFilled style={{ fontSize: 20, color: makeColor(255, 20, 147) }} />
              </Tooltip> : <></>}
            {fixedLen ?
              <Tooltip title={'Fixed Length'}>
                <FixedLength style={{ fontSize: 20, color: makeColor(0, 191, 255) }} />
              </Tooltip> : <></>}
          </Space>
          <div style={hovered ? {} : { display: 'none' }}>
            <Space.Compact className="node-controll-button-holder" size='small'>
              <Tooltip title={'Edit'} mouseEnterDelay={0.5}>
                <Button type='text' onClick={() => { editStage() }} icon={<EditOutlined />} />
              </Tooltip>
              <Tooltip title={'Clone'} mouseEnterDelay={0.5}>
                <Button type='text' onClick={() => { cloneStage() }} icon={<CopyOutlined />} />
              </Tooltip>
              <Tooltip title={'Delete'} mouseEnterDelay={0.5}>
                <Button type='text' onClick={() => { node.remove() }} icon={<CloseOutlined style={{ color: 'red' }} />} />
              </Tooltip>
            </Space.Compact>
          </div>
        </Row>
        <div className='stage-name'>
          <h4>{label ?
            <Tooltip title={label}>
              {label}
            </Tooltip>
            : 'Untitled'}
          </h4>
        </div>
      </div>
    </Dropdown>
  );
}

register({
  shape: "stage_node",
  width: NODE_WIDTH,
  height: NODE_HEIGHT,
  ports: {
    groups: {
      default: {
        markup: [
          {
            tagName: 'path',
            selector: 'path',
          },
        ],
        attrs: {
          path: {
            d: 'M 0 -40 L 10 0 L 0 40 z',
            magnet: true,
            stroke: PORT_DEFAULTS.stroke,
            strokeWidth: 1,
            fill: PORT_DEFAULTS.fill,
          },
        },
        position: 'absolute'
      },
    },
    items: [
      {
        group: 'default',
        args: {
          x: (NODE_WIDTH - 1.0),
          y: '50%'
        },
      },
    ]
  },
  effect: [
    'name',
    'isOrgasm',
    'fixedLen',
    'isStart',
  ],
  component: StageNode,
});
