import { Button, Checkbox, Col, Form, Icon, Input, Menu, message, Modal, Row, Select, Switch, Table, Typography } from 'antd';
import React, { useEffect, useState } from "react";
import MonacoEditor from "react-monaco-editor";
import instance from './request/request';
import SocketHelper from './utils/socketHelper';

const languages = ['apex', 'azcli', 'bat', 'clojure', 'coffee', 'cpp', 'csharp', 'csp', 'css', 'dockerfile', 'fsharp', 'go', 'handlebars', 'html', 'ini', 'java', 'javascript', 'json', 'less', 'lua', 'markdown', 'msdax', 'mysql', 'objective', 'perl', 'pgsql', 'php', 'postiats', 'powerquery', 'powershell', 'pug', 'python', 'r', 'razor', 'redis', 'redshift', 'ruby', 'rust', 'sb', 'scheme', 'scss', 'shell', 'solidity', 'sql', 'st', 'swift', 'typescript', 'vb', 'xml', 'yaml'];

const App = (props: any) => {
  const [size, setSize] = useState({ width: document.body.clientWidth, height: document.body.clientHeight - 46 });
  const [code, setCode] = useState("");
  const [loginVisible, setLoginVisible] = useState(false);
  const [btnloading, setBtnLoading] = useState(false);
  const [roomList, setRoomList] = useState([]);
  const [roomVisible, setRoomVisible] = useState(false);
  const [activeLanguages, setActiveLanguages] = useState('javascript');
  const [createVisible, setCreateVisible] = useState(false);
  const [publish, setPublish] = useState(0);
  const [name, setName] = useState("");
  const [roomInfo, setRoomInfo] = useState(null as any);
  const [queryRoom, setQueryRoom] = useState("");
  const [limitMine, setLimitMine] = useState(false);
  const [roomLoading, setRoomLoading] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [count, setCount] = useState(0);

  window.onresize = () => {
    setSize({ width: document.body.clientWidth, height: document.body.clientHeight - 46 });
  }
  const saveCode = (flag?: boolean) => {
    if (roomInfo && code && localStorage.getItem('user_id') + "" === roomInfo.user_db_id + "") {
      instance.post("/room/save", { code, room_id: roomInfo.id })
        .then(p => {
          setRoomList(p.data.result);
          !flag && message.success(flag ? "代码已自动保存" : "代码已保存")
        })
    }
  }
  useEffect(() => {
    SocketHelper.IniSocket();
    // localStorage.removeItem('token');
    // localStorage.removeItem('user_id');
  }, [])
  useEffect(() => {
    const time = setInterval(() => { saveCode(true) }, 10000);
    return () => {
      clearInterval(time);
    }
  }, [roomInfo, code]);
  useEffect(() => {
    if (roomInfo) {
      SocketHelper.Socket.emit('add_room', { room_id: roomInfo.id });
      setCode(roomInfo.code);
      SocketHelper.Socket.on('editCode', (respone: { room_id: string, msg: string }) => {
        if (respone.room_id === roomInfo.id) {
          setCode(respone.msg);
        }
      })
      setRoomVisible(false);
      message.success("加入房间成功");
    }
    return () => {
      try {
        if (roomInfo) {
          SocketHelper.Socket.emit('out_room', { room_id: roomInfo.id });
        }
      } catch (error) {
        // 没有东西
      }
    }

  }, [roomInfo])
  useEffect(() => {
    setRoomLoading(true);
    instance.post("/room/list", { name: queryRoom, query: limitMine ? "0" : "1", pageNum })
      .then(p => {
        setRoomList(p.data.result);
        setCount(p.data.count);
      })
      .finally(() => {
        setRoomLoading(false);
      })
  }, [queryRoom, limitMine, roomVisible, pageNum]);
  const loginMethod = (func: () => void) => {
    if (localStorage.getItem('token')) {
      func();
      return;
    }
    // 去登陆
    setLoginVisible(true);
  };


  return (
    <div>
      <Menu selectedKeys={[]} theme="dark" mode="horizontal">
        <Menu.Item key="create" onClick={() => { loginMethod(() => setCreateVisible(true)); }} >
          <Icon type="appstore" />
          创建房间
      </Menu.Item>
        <Menu.Item onClick={() => {
          setPageNum(1)
          setRoomLoading(true);
          instance.post("/room/list", { name: queryRoom, query: limitMine ? "0" : "1" })
            .then(p => {
              setRoomList(p.data.result);
              setCount(p.data.count);
            })
            .finally(() => {
              setRoomLoading(false);
            })
          setRoomVisible(true)
        }} key="add">
          <Icon type="usergroup-add" />
          加入房间
      </Menu.Item>
        {/* <Menu.Item key="setting">
          <Icon type="mail" />
          设置
      </Menu.Item> */}
        {
          localStorage.getItem('token') ?
            <Menu.Item key="login">
              <Icon type="user" />
              欢迎您
            </Menu.Item> :
            <Menu.Item onClick={() => setLoginVisible(true)} key="login">
              <Icon type="user" />
              登录
            </Menu.Item>
        }
        <Menu.Item disabled={true} key="lang">
          {(roomInfo && roomInfo.language) || "javascript"}
        </Menu.Item>
        <Menu.Item disabled={true} key="homeId">
          {(roomInfo && '房间号：' + roomInfo.id)}
        </Menu.Item>
        <Menu.Item onClick={() => {
          saveCode(false);
        }} key="save_code">
          {(roomInfo && localStorage.getItem('user_id') + "" === roomInfo.user_db_id + "" && '保存代码')}
        </Menu.Item>
      </Menu>
      <MonacoEditor
        height={size.height}
        width={size.width}
        language={(roomInfo && roomInfo.language) || "javascript"}
        theme="vs-dark"
        value={code}
        onChange={(value) => {
          if (!roomInfo) {
            setCode(value);
          }
          else if (!localStorage.getItem('token') || localStorage.getItem('user_id') + "" !== roomInfo.user_db_id + "") {
            setCode(code);
            message.error("没有编辑的权限");
          }
          else {
            setCode(value);
            SocketHelper.Socket.emit('editCode', { msg: value, room_id: roomInfo.id });
          }
        }}
      />
      <Modal
        onCancel={() => setLoginVisible(false)}
        footer={false}
        visible={loginVisible}
        title="登录"
      >
        <Form onSubmit={(e) => {
          e.preventDefault();
          props.form.validateFields((err: any, values: any) => {
            if (!err) {
              setBtnLoading(true);
              instance.post('/user/login', { user_id: values.userid, user_pwd: values.userpwd }, { headers: { tips: true } })
                .then((p: any) => {
                  if (p.data.code === 2) {
                    Modal.confirm({
                      title: "提示",
                      content: "点击确定将为您创建账号",
                      okText: "确定",
                      cancelText: "取消",
                      onOk: () => {
                        instance.post('/user/register', { user_id: values.userid, user_pwd: values.userpwd })
                          .then((result: any) => {
                            message.success("注册成功");
                            localStorage.setItem("token", result.data.data.token);
                            localStorage.setItem("user_id", result.data.data.user_id);
                            setLoginVisible(false);
                          })
                      }
                    })
                  }
                  else if (p.data.code === 0) {
                    localStorage.setItem("token", p.data.data.token);
                    localStorage.setItem("user_id", p.data.data.user_id);
                    message.success('登录成功');
                    setLoginVisible(false);
                  }
                })
                .finally(() => {
                  setBtnLoading(false);
                })
            }
          });
          // setLoginVisible(false);
        }} className="login-form">
          <Form.Item>
            {props.form.getFieldDecorator('userid', {
              rules: [{ required: true, message: '请输入账号' }],
            })(
              <Input
                prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
                placeholder="请输入账号"
              />,
            )}
          </Form.Item>
          <Form.Item>
            {props.form.getFieldDecorator('userpwd', {
              rules: [{ required: true, message: '请输入密码' }],
            })(
              <Input
                prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
                type="password"
                placeholder="请输入密码"
              />,
            )}
          </Form.Item>
          <Form.Item>
            <Button loading={btnloading} style={{ width: "100%" }} type="primary" htmlType="submit">
              登录
            </Button>
            <div style={{ textAlign: "right" }} >
              <Typography.Text type="secondary" >如果未注册会自动注册账号</Typography.Text>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        footer={false}
        onCancel={() => {
          setRoomVisible(false)
        }} title="加入房间" visible={roomVisible} >
        <Row >
          <Col span={17}  >
            <Input value={queryRoom} onChange={e => { setQueryRoom(e.target.value) }} placeholder="输入房间ID和名称查询" style={{ marginBottom: 16 }} />
          </Col>
          <Col span={7} style={{ textAlign: "right", height: 32, lineHeight: 2 }} >
            <Checkbox value={limitMine} onChange={e => { setPageNum(1); setLimitMine(e.target.checked) }} >仅查看自己的</Checkbox>
          </Col>
        </Row>
        <Table
          pagination={{
            onChange: (pageNum1: number) => {
              setPageNum(pageNum1)
            },
            current: pageNum,
            total: count,
            pageSize: 5
          }}
          loading={roomLoading} rowKey="_id" bordered={true} dataSource={roomList} columns={[
            { title: "ID", key: "id", dataIndex: "id" },
            { title: "名称", key: "name", dataIndex: "name" },
            {
              title: "操作", key: "modfily", render: (item) => {
                // 加入房间
                return (
                  <a onClick={() => {
                    setRoomInfo(item)
                    // SocketHelper.Socket.emit('add_room', { room_id: item.id });
                    // setRoomVisible(false);
                    // message.success("加入房间成功");
                  }} >加入房间</a>
                )
              }
            }
          ]} />
      </Modal>

      <Modal
        okText="确定"
        cancelText="取消"
        onCancel={() => {
          setCreateVisible(false)
        }}
        title="创建房间"
        onOk={() => {
          // 创建房间
          instance.post('/room/create', { name, publish, language: activeLanguages }, { headers: { tips: true } })
            .then(p => {
              message.success("创建成功");
              setRoomInfo(p.data.data);
              setCreateVisible(false);
            })
        }}
        visible={createVisible} >
        <div style={{ marginBottom: 16 }} >
          <Input
            value={name}
            onChange={e => { setName(e.target.value) }}
            prefix={<Icon type="home" style={{ color: 'rgba(0,0,0,.25)' }} />}
            placeholder="请输入房间名称"
          />
        </div>
        <div style={{ marginBottom: 16 }} >
          <Switch checked={publish === 0} onChange={e => {
            setPublish(e ? 0 : 1)
          }} style={{ marginRight: 8 }} /> {publish === 1 ? '私有' : '公有'}
        </div>
        <div style={{ marginBottom: 16 }} >
          <Select value={activeLanguages} onSelect={(select: string) => {
            setActiveLanguages(select)
          }} style={{ width: 200 }} >
            {
              languages.map(p => {
                return (
                  <Select.Option value={p} key={p} >
                    {p}
                  </Select.Option>
                )
              })
            }
          </Select>
        </div>
      </Modal>
    </div>
  )
}
export default Form.create({ name: 'normal_login' })(App);