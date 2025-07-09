import { Checkbox } from "antd";

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

export default CheckboxEx;
