import React, {Component} from 'react'
import {connect} from 'react-redux'
import {
    adminFetchUsers,
    adminChangeUserStatus,
    adminDeleteUser,
    adminCreateUser,
    adminUpdateUser,
    resetUserPassword,
    changeFellow,
    getPermissions,
	resetMFA
} from '../../../store/actions/admin/users'
import CreateUserModal from '../../../components/admin/user/create-user-modal'
import UpdateUserModal from '../../../components/admin/user/update-user-modal'
import {Typography, Table, Button, message, Tag, Modal, Icon, Dropdown, Menu, Input, Select, Tabs} from 'antd'
import {NavLink} from "react-router-dom";
import RegistrationTokens from '../../admin/registrationTokens/registrationTokens'
import PromotionCodes from "./promotionCodes/PromotionCodes"
import { CSVLink } from "react-csv";

const { Option, OptGroup } = Select;
const { Title } = Typography
const { Column } = Table
const confirmModal = Modal.confirm
const {TabPane} = Tabs

class AdminUsers extends Component {

    constructor(props) {
        super(props)
        this.loader = message.loading('Loading..', 0)
        this.state = {
            userCreateModalVisible: false,
            userUpdateModalVisible: false,
            editingUser: null,
            currentPage: 1,
            pageSize: 10,
            searchName: '',
            searchEmail: '',
            searchStatus: '',
            searchRole: '',
        }
    }

    componentDidMount() {
        const {pageSize, currentPage} = this.state
        if(this.props.match?.params?.role) {
            this.setState({searchRole: this.props.match?.params?.role})
        }
        this.props.adminFetchUsers(currentPage, pageSize, '', '', '', this.props.match?.params?.role).then(res => {
            this.loader()
        })
    }

    toggleUserCreateModal = () => {
        this.setState({
            userCreateModalVisible: !this.state.userCreateModalVisible
        })
    }

    toggleUpdateUserModal = () => {
        this.setState({
            userUpdateModalVisible: !this.state.userUpdateModalVisible
        })
    }

    editUser = id => {
        const {data} = this.props.adminUsers
        const user = data.find(x => x.id === id)

        this.setState({
            editingUser: user
        })
        this.toggleUpdateUserModal()
    }

    showDeleteConfirm = (id) => {
        confirmModal({
            title: 'Are you sure you want to delete this user?',
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk: () => {
                this.props.adminDeleteUser(id).then(res => {
                    if (res) {
                        message.success('Deleted!')
                    } else {
                        message.error('Something went wrong, please try again.')
                    }
                })
            }
        })
    }

    resetPassword = (id) => {
        confirmModal({
            title: `Are you sure you want to reset this user's password?`,
            okText: 'Yes',
            okType: 'primary',
            cancelText: 'No',
            onOk: () => {
                const loader = message.loading('Resetting password...', 0)
                this.props.resetUserPassword(id).then(res => {
                    loader()
                    if (res.status >= 200 && res.status < 300) {
                        message.success(res.data.message)
                    } else {
                        message.error(res.data.message)
                    }
                })
            }
        })
    }

    resetMFA = (id) => {
        const loader = message.loading('Resetting',0)
        this.props.resetMFA(id).then(res => {
            loader()
            if (res === true) {
                message.success('MFA Reset')
            } else {
                message.error('Something went wrong, please try again.')
            }
        })
    }

    showChangeStatusConfirm = (id, status) => {
        confirmModal({
            title: `Are you sure change this user's status to ${status ? 'Inactive' : 'Active'}?`,
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk: () => {
                this.props.adminChangeUserStatus(id, !status).then(res => {
                    if (res) {
                        message.success('Success!')
                    } else {
                        message.error('Something went wrong, please try again.')
                    }
                })
            }
        })
    }

    fellow = id => {
        this.props.changeFellow(id).then(res => {
            if (res === true) {
                message.success('Changed!')
            } else {
                message.error(res.data.message || 'Something went wrong, please try again.')
            }
        })
    }

    paginate = page => {
        const {pageSize, searchName, searchEmail, searchStatus, searchRole} = this.state
        this.setState({
            currentPage: page.current
        })
        this.props.adminFetchUsers(page.current, pageSize, searchName, searchEmail, searchStatus, searchRole).then(res => {
        })
    }

    changeSearchName = (e) => {
        const {currentPage, pageSize, searchEmail, searchStatus, searchRole} = this.state
        this.setState({
            searchName: e.target.value
        })
        this.props.adminFetchUsers(currentPage, pageSize, e.target.value, searchEmail, searchStatus, searchRole)
    }

    changeSearchEmail = (e) => {
        const {currentPage, pageSize, searchName, searchStatus, searchRole} = this.state
        this.setState({
            searchEmail: e.target.value
        })
        this.props.adminFetchUsers(currentPage, pageSize, searchName, e.target.value, searchStatus, searchRole)
    }

    changeSearchStatus = (e) => {
        const {currentPage, pageSize, searchName, searchEmail, searchRole} = this.state
        this.setState({
           searchStatus: e
        })
        this.props.adminFetchUsers(currentPage, pageSize, searchName, searchEmail, e, searchRole)
    }

    changeSearchRoles = (e) => {
        const {currentPage, pageSize, searchName, searchEmail, searchStatus} = this.state
        this.setState({
            searchRole: e
        })
        this.props.adminFetchUsers(currentPage, pageSize, searchName, searchEmail, searchStatus, e)
    }

    createCSVData = (csvData= []) => {
        return csvData.map(e =>  ( {firstname: e.firstname, lastname: e.lastname, email: e.email} ))
    }

    render() {
        const {data, roles, total, csvData} = this.props.adminUsers
        const {userCreateModalVisible, userUpdateModalVisible, editingUser, currentPage, pageSize, searchName, searchEmail } = this.state

        const CsvData = this.createCSVData(csvData)
        const linkStyle = {"color":"inherit"}
        return (

                <div className={'user-tab-container'}>
                    <Tabs defaultActiveKey={'users-list'}>
                        <TabPane tab={'Users'} key={'users-list'}>
                            <div className={'page-title'}>
                                <Title>
                                    Users
                                </Title>
                                <Button type={'primary'} onClick={this.toggleUserCreateModal}>Create User</Button>

                                <CSVLink
                                    data={CsvData}
                                    filename={"users-data.csv"}
                                    target="_blank"
                                >
                                    <Button type={'primary'} style={{marginLeft: '20px'}}  >Export CSV</Button>
                                </CSVLink>
                                {/*<NavLink to={'/admin/registration-tokens'} style={{margin: "0 5px"}} ><Button type={'primary'} >Registration Tokens</Button></NavLink>*/}
                            </div>
                            <div>
                                <Table className={'admin-users-table'} loading={false} dataSource={data} rowKey={item => item.id} onChange={this.paginate}  pagination={
                                    {
                                        position: 'bottom',
                                        current: currentPage,
                                        pageSize,
                                        total,
                                        defaultCurrent: 1,
                                    }}
                                >
                                    <Column title={() => {
                                        return (
                                            <Input
                                                value={searchName}
                                                placeholder="Search user by Name"
                                                onChange={this.changeSearchName}
                                                name="searchName"

                                            />
                                        )
                                    }}  key={'name'}
                                            render={(text, record) => {
                                                return (
                                                    <>
                                                        <NavLink style={linkStyle} to={`/admin/user-statistics/${record.id}`} >
                                                            {record.firstname} {record.lastname}
                                                        </NavLink>
                                                        {record.is_fellow ? <Tag color={'blue'}>fellow</Tag> : ''}
                                                    </>
                                                )
                                            }}
                                            className={'column-admin-users-name'}
                                    />
                                    <Column title={() => {
                                        return (
                                            <Input
                                                value={searchEmail}
                                                placeholder="Search user by Email"
                                                onChange={this.changeSearchEmail}
                                                name="searchEmail"
                                            />
                                        )
                                    }}  render={(text, record) => {
                                            return (
                                                    <NavLink style={linkStyle} to={`/admin/user-statistics/${record.id}`} >
                                                        {record.email}
                                                    </NavLink>
                                            )
                                        }} key={'email'} className={'column-admin-users-email'}/>
                                    <Column title={() => {
                                        return (
                                            <Select placeholder={"Search by Status"} style={{ width: 200 }} onChange={this.changeSearchStatus}  >
                                                <OptGroup label="Status">
                                                    <Option value="">All</Option>
                                                    <Option value="active">Active</Option>
                                                    <Option value="unActive">Unactive</Option>
                                                </OptGroup>
                                            </Select>
                                        )
                                    }} key={'activated'}
                                            render={(text, record) => {
                                                return (<Tag color={record.activated ? 'blue' : 'red'}>{record.activated ? 'Active' : 'Inactive'}</Tag>)
                                            }}
                                            className={'column-admin-users-status'}
                                    />
                                    <Column title={() => {
                                        return (
                                            <Select placeholder={"Search by Roles"} style={{ width: 200 }} onChange={this.changeSearchRoles}  >
                                                <OptGroup label="Roles">
                                                    <Option value="" >All</Option>
                                                    <Option value="regular_users">Regular User</Option>
                                                    <Option value="fellow" >Fellow</Option>
                                                    <Option value="fellow_operator" >Fellow Operator</Option>
													{
														roles.map(e =>  <Option key={e.slug} value={e.slug} >{e.name}</Option> )
													}
                                                </OptGroup>
                                            </Select>
                                        )
                                    }} key={'id'}
                                            render={(text, record) => {
                                                return (
                                                    <>
                                                        {record.roles.map(item => {
                                                            return (<Tag color={'blue'} key={item.id}>{item.slug}</Tag>)
                                                        })}
                                                        {record.permissions.map(item => {
                                                            return (<Tag color={'blue'} key={item.id}>{item.slug}</Tag>)
                                                        })}
                                                    </>
                                                )
                                            }}
                                            className={'column-admin-users-roles'}
                                    />
                                    <Column title={'Actions'} key={'actions'} style={{width: '80px'}}
                                            render={(text, record) => {
                                                return (
                                                    <Dropdown overlay={
                                                        <Menu>
                                                            <Menu.Item onClick={() => this.showChangeStatusConfirm(record.id, record.activated)}>
                                                                <Icon type={(record.activated ? 'close': 'check') + '-circle'} /> {record.activated ? 'Deactivate' : 'Activate'}
                                                            </Menu.Item>
                                                            <Menu.Item onClick={() => this.editUser(record.id)}><Icon type="edit" /> Edit</Menu.Item>
                                                            <Menu.Item onClick={() => this.showDeleteConfirm(record.id)}><Icon type="delete" /> Delete</Menu.Item>
                                                            <Menu.Item onClick={() => this.resetPassword(record.id)} ><Icon type="redo" /> Reset Password</Menu.Item>
															<Menu.Item onClick={() => this.resetMFA(record.id)} ><Icon type="redo" /> Reset MFA</Menu.Item>
                                                            <Menu.Item onClick={() => this.fellow(record.id)}><Icon type={record.is_fellow ? 'usergroup-delete' : 'usergroup-add'}/> {record.is_fellow ? 'Remove Fellow' : 'Make Fellow'}</Menu.Item>
                                                            <Menu.Item ><NavLink to={`/admin/user-statistics/${record.id}`}><Icon type="bar-chart" style={{marginRight: "10px"}} />User Statistics</NavLink></Menu.Item>
                                                        </Menu>
                                                    }>
                                                        <Button>
                                                            Actions <Icon type="down" />
                                                        </Button>
                                                    </Dropdown>
                                                )
                                            }}
                                    />
                                </Table>
                            </div>

                            <CreateUserModal
                                toggleModal={this.toggleUserCreateModal}
                                visible={userCreateModalVisible}
                                createUser={data => this.props.adminCreateUser(data)}
                                roles={roles}
                            />
                            {
                                userUpdateModalVisible &&
                                <UpdateUserModal
                                    toggleModal={this.toggleUpdateUserModal}
                                    visible={userUpdateModalVisible}
                                    updateUser={(id, data) => this.props.adminUpdateUser(id, data)}
                                    roles={roles}
                                    user={editingUser}
                                    getPermissions={this.props.getPermissions}
                                />
                            }
                        </TabPane>
                        <TabPane tab={"Registration Tokens"} key={'registration-tokens'}>
                            <RegistrationTokens/>
                        </TabPane>
                        <TabPane tab={'Promotion Codes'} key={'promotion-codes'}>
                            <PromotionCodes/>
                        </TabPane>
                    </Tabs>

                </div>

        )
    }
}


function mapStateToProps(state) {
    return {
        adminUsers: state.adminUsers
    }
}

function mapDispatchToProps(dispatch) {
    return {
        adminFetchUsers: (page, pageSize, searchName, searchEmail, searchStatus, searchRole) => dispatch(adminFetchUsers(page, pageSize, searchName, searchEmail, searchStatus, searchRole)),
        adminDeleteUser: id => dispatch(adminDeleteUser(id)),
        adminChangeUserStatus: (id, status) => dispatch(adminChangeUserStatus(id, status)),
        adminCreateUser: data => dispatch(adminCreateUser(data)),
        adminUpdateUser: (id, data) => dispatch(adminUpdateUser(id, data)),
        resetUserPassword: id => dispatch(resetUserPassword(id)),
        changeFellow: id => dispatch(changeFellow(id)),
        getPermissions: keyword => dispatch(getPermissions(keyword)),
		resetMFA: id => dispatch(resetMFA(id)),

	}
}

export {AdminUsers}
export default connect(mapStateToProps, mapDispatchToProps)(AdminUsers)