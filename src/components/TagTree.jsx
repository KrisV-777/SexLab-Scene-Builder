import React, { useState, useMemo } from "react";
import { Input, Button, Tag, Space, Divider, TreeSelect } from 'antd';

function TagTree({
  tags,
  onChange,
  tagsSFW = [],
  tagsNSFW = [],
  ...treeSelectProps
}) {
  const [customTag, setCustomTag] = useState('');
  const tagTree = useMemo(() => [
    {
      value: 'tagsSFW',
      title: 'SFW',
      selectable: false,
      children: tagsSFW.map(tag => ({ value: tag, title: tag })),
    },
    {
      value: 'tagsNSFW',
      title: 'NSFW',
      selectable: false,
      children: tagsNSFW.map(tag => ({ value: tag, title: tag })),
    },
  ], [tagsSFW, tagsNSFW]);

  const addCustomTags = () => {
    const add = customTag.split(',');
    const newTags = [];
    add.forEach(tag => {
      tag = tag.trim();
      const s = tag.toLowerCase().replace(/\s+/g, '');
      if (!s || tags.find(t => t.toLowerCase().replace(/\s+/g, '') === s))
        return;
      newTags.push(tag);
    });
    if (newTags.length > 0) {
      onChange([...tags, ...newTags]);
    }
    setCustomTag('');
  }

  return (
    <TreeSelect
      className="tag-display-field"
      size="large"
      multiple
      placeholder="Please Select Tags"
      allowClear
      value={tags}
      onSelect={e => onChange([...tags, e])}
      onClear={() => onChange([])}
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
          onChange(tags.filter(tag => tag !== value));
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
      treeExpandAction={'click'}
      {...treeSelectProps}
    />
  );
}

export default TagTree;

