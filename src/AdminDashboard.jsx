import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function AdminDashboard() {
    const [menuItems, setMenuItems] = useState([])
    const [orders, setOrders] = useState([])
    const [activeTab, setActiveTab] = useState('menuItems')
    const [loading, setLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [newItem, setNewItem] = useState({
        title: '',
        price: '',
        image: '',
        category: 'Main Course',
        description: ''
    })


    useEffect(() => {
        fetchData()
    }, [activeTab])

    const fetchData = async () => {
        setLoading(true)
        if (activeTab === 'menuItems') {
            const { data } = await supabase.from('menu_items').select('*').order('created_at', { ascending: false })
            setMenuItems(data || [])
        } else {
            const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
            setOrders(data || [])
        }
        setLoading(false)
    }

    const handleAddItem = async (e) => {
        e.preventDefault()
        const itemToInsert = { ...newItem }
        const { error } = await supabase.from('menu_items').insert([itemToInsert])
        if (error) alert(error.message)
        else {
            setIsAdding(false)
            setNewItem({ title: '', price: '', image: '', category: 'Main Course', description: '' })
            fetchData()
        }
    }


    const handleUpdateItem = async (e) => {
        e.preventDefault()
        const { error } = await supabase.from('menu_items').update(editingItem).eq('id', editingItem.id)
        if (error) alert(error.message)
        else {
            setEditingItem(null)
            fetchData()
        }
    }

    const handleDeleteItem = async (id) => {
        if (window.confirm('Are you sure you want to delete this menu item?')) {
            const { error } = await supabase.from('menu_items').delete().eq('id', id)
            if (error) alert(error.message)
            else fetchData()
        }
    }

    const handleUpdateOrderStatus = async (id, status) => {
        const { error } = await supabase.from('orders').update({ status }).eq('id', id)
        if (error) alert(error.message)
        else fetchData()
    }

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 className="logo-branding" style={{ fontSize: '2rem' }}>Midnight Canteen Admin</h1>
                    <a href="/" className="nav-link">View Website</a>
                </div>
            </header>

            <div className="container">
                <div className="admin-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'menuItems' ? 'active' : ''}`}
                        onClick={() => setActiveTab('menuItems')}
                    >
                        Menu Items
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        Orders
                    </button>
                </div>

                {loading ? (
                    <div className="loader">Loading Dashboard...</div>
                ) : (
                    <main className="admin-content">
                        {activeTab === 'menuItems' && (
                            <section>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                    <h2>Manage Menu</h2>
                                    <button className="btn-primary" onClick={() => setIsAdding(true)}>Add New Item</button>
                                </div>

                                {(isAdding || editingItem) && (
                                    <div className="admin-modal-overlay">
                                        <div className="admin-modal">
                                            <h3>{isAdding ? 'Add New Menu Item' : 'Edit Menu Item'}</h3>
                                            <form onSubmit={isAdding ? handleAddItem : handleUpdateItem}>
                                                <div className="form-group">
                                                    <label>Item Name</label>
                                                    <input
                                                        type="text"
                                                        value={isAdding ? newItem.title : editingItem.title}
                                                        onChange={(e) => isAdding ? setNewItem({ ...newItem, title: e.target.value }) : setEditingItem({ ...editingItem, title: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Price (₱)</label>
                                                    <input
                                                        type="number"
                                                        value={isAdding ? newItem.price : editingItem.price}
                                                        onChange={(e) => isAdding ? setNewItem({ ...newItem, price: e.target.value }) : setEditingItem({ ...editingItem, price: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Image URL</label>
                                                    <input
                                                        type="text"
                                                        value={isAdding ? newItem.image : editingItem.image}
                                                        onChange={(e) => isAdding ? setNewItem({ ...newItem, image: e.target.value }) : setEditingItem({ ...editingItem, image: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Category</label>
                                                    <select
                                                        value={isAdding ? newItem.category : editingItem.category}
                                                        onChange={(e) => isAdding ? setNewItem({ ...newItem, category: e.target.value }) : setEditingItem({ ...editingItem, category: e.target.value })}
                                                    >
                                                        <option value="Main Course">Main Course</option>
                                                        <option value="Snacks">Snacks</option>
                                                        <option value="Drinks">Drinks</option>
                                                    </select>
                                                </div>
                                                <div className="form-group">
                                                    <label>Description</label>
                                                    <textarea
                                                        value={isAdding ? newItem.description : editingItem.description}
                                                        onChange={(e) => isAdding ? setNewItem({ ...newItem, description: e.target.value }) : setEditingItem({ ...editingItem, description: e.target.value })}
                                                        rows="4"
                                                        style={{ width: '100%', padding: '1rem', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.03)', color: 'white', borderBottom: '2px solid var(--c-gold)', fontFamily: 'inherit' }}
                                                    ></textarea>
                                                </div>

                                                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                                    <button type="submit" className="btn-primary">Save Item</button>
                                                    <button type="button" className="btn-secondary" onClick={() => { setIsAdding(false); setEditingItem(null); }}>Cancel</button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}

                                <div className="admin-table-container">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Image</th>
                                                <th>Item Name</th>
                                                <th>Price</th>
                                                <th>Category</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {menuItems.map(p => (
                                                <tr key={p.id}>
                                                    <td><img src={p.image} alt={p.title} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} /></td>
                                                    <td>{p.title}</td>
                                                    <td>₱{Number(p.price).toLocaleString()}</td>
                                                    <td>{p.category}</td>
                                                    <td>
                                                        <button onClick={() => setEditingItem(p)} style={{ marginRight: '1rem', color: 'var(--c-gold)', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                                                        <button onClick={() => handleDeleteItem(p.id)} style={{ color: 'rgba(255, 68, 68, 0.8)', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}

                        {activeTab === 'orders' && (
                            <section>
                                <h2>Manage Orders</h2>
                                <div className="admin-table-container">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Customer & Contact</th>
                                                <th>Type / Table</th>
                                                <th>Payment</th>
                                                <th>Total</th>
                                                <th>Status</th>
                                                <th>Date</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map(o => (
                                                <tr key={o.id}>
                                                    <td>#{o.id}</td>
                                                    <td>
                                                        <strong>{o.full_name}</strong><br />
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>📞 {o.phone}</span><br />
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>📍 {o.address}</span>
                                                    </td>
                                                    <td>
                                                        <span style={{ textTransform: 'uppercase', fontWeight: 'bold', color: o.order_type === 'delivery' ? '#00d4ff' : '#ff9f43' }}>
                                                            {o.order_type === 'delivery' ? '🚀 Delivery' : '🍽️ Dine In'}
                                                        </span>
                                                        {o.table_number && <><br /><span style={{ color: 'var(--c-gold)', fontSize: '0.9rem' }}>{o.table_number}</span></>}
                                                    </td>
                                                    <td>
                                                        <span style={{ textTransform: 'uppercase', fontWeight: '600' }}>
                                                            {o.payment_method === 'gcash' ? '📱 GCash' : '💵 COD'}
                                                        </span>
                                                    </td>
                                                    <td>₱{Number(o.total_amount).toLocaleString()}</td>
                                                    <td>
                                                        <span className={`status-badge ${o.status}`}>
                                                            {o.status}
                                                        </span>
                                                    </td>
                                                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                                                    <td>
                                                        <select
                                                            value={o.status}
                                                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                                            style={{ padding: '0.4rem', fontSize: '0.8rem', background: 'var(--c-midnight)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '4px' }}
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="preparing">Preparing</option>
                                                            <option value="out-for-delivery">Out for Delivery</option>
                                                            <option value="delivered">Delivered</option>
                                                            <option value="cancelled">Cancelled</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}
                    </main>
                )}
            </div>
        </div>
    )
}
export default AdminDashboard
