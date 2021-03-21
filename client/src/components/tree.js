export default class Tree {
  constructor(root) {
    this._root = root || null;
  }

  _traverse(callback) {
    function goThrough(node) {
      callback(node);
      node.children.forEach((child) => {
        goThrough(child);
      });
    }
    goThrough(this._root);
  }

  _addNode(label, open, editing, parentValue) {
    const newNode = {
      label,
      open,
      editing,
      children: [],
      parentValue: parentValue,
    };

    if (this._root === null) {
      this._root = newNode;
      return;
    }

    this._traverse((node) => {
      if (node.label === parentValue) {
        node.children.push(newNode);
      }
    });
  }

  _removeNode(label) {
    this._traverse((node) => {
      node.children.forEach((childNode, index) => {
        if (childNode.label === label) {
          node.children.splice(index, 1);
        }
      });
    });
  }

  _search(label) {
    let returnNode = 'Not Found';
    this._traverse((node) => {
      if (node.label === label) {
        returnNode = node;
      }
    });
    return returnNode;
  }

  _displayLeafs(parentValue) {
    const parentNode =
      typeof parentValue === 'string' ? this._search(parentValue) : parentValue;
    let leafsRet = [];
    if (parentValue.children && !parentValue.children.length) {
      return parentValue;
    }

    parentNode.children.forEach((child) => {
      leafsRet.push(this._displayLeafs(child));
    });

    return leafsRet.flat();
  }
}

class Node {
  constructor(label, open, editing, children) {
    this.label = label;
    this.open = open;
    this.editing = editing;
    this.children = children;
  }
}
