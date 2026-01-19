import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

const formatTime12h = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' +
        date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

export default function AdminDashboard() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loginError, setLoginError] = useState('')
    const [activeTab, setActiveTab] = useState('orders')

    // Data States
    const [orders, setOrders] = useState([])
    const [menuItems, setMenuItems] = useState([])
    const [categories, setCategories] = useState([])
    const [storeSettings, setStoreSettings] = useState({})
    const [paymentSettings, setPaymentSettings] = useState([])
    const [orderTypes, setOrderTypes] = useState([])
    const [selectedOrder, setSelectedOrder] = useState(null)

    // Edits
    const [isAddingItem, setIsAddingItem] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [itemForm, setItemForm] = useState({
        name: '', description: '', price: '', promo_price: '', category_id: '',
        image: '', out_of_stock: false, sort_order: 0,
        variations: [], flavors: [], addons: []
    })
    const [newCategoryName, setNewCategoryName] = useState('')

    useEffect(() => {
        const auth = sessionStorage.getItem('gabzab_admin_auth')
        if (auth === 'true') {
            setIsAuthenticated(true)
            fetchAllData()
        }
    }, [])

    useEffect(() => {
        if (isAuthenticated) {
            fetchAllData()
            // Realtime subscription for orders
            const subscription = supabase
                .channel('orders')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
                .subscribe()
            return () => { supabase.removeChannel(subscription) }
        }
    }, [isAuthenticated])

    const fetchAllData = () => {
        fetchOrders()
        fetchMenuItems()
        fetchCategories()
        fetchSettings()
        fetchPaymentSettings()
        fetchOrderTypes()
    }

    const fetchOrders = async () => {
        const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
        if (data) setOrders(data)
    }

    const fetchMenuItems = async () => {
        const { data } = await supabase.from('menu_items').select('*').order('sort_order', { ascending: true })
        if (data) setMenuItems(data)
    }

    const fetchCategories = async () => {
        const { data } = await supabase.from('categories').select('*').order('sort_order', { ascending: true })
        if (data) setCategories(data)
    }

    const fetchSettings = async () => {
        const { data } = await supabase.from('store_settings').select('*').single()
        if (data) setStoreSettings(data)
    }

    const fetchPaymentSettings = async () => {
        const { data } = await supabase.from('payment_settings').select('*').order('created_at', { ascending: true })
        if (data) setPaymentSettings(data)
    }

    const fetchOrderTypes = async () => {
        const { data } = await supabase.from('order_types').select('*').order('id', { ascending: true })
        if (data) setOrderTypes(data)
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoginError('')

        // Simple check + Fallback
        try {
            const { data, error } = await supabase.from('admin_users').select('*').eq('username', username).eq('password', password).single()
            if ((data && !error) || (username === 'admin' && password === 'admin123')) {
                setIsAuthenticated(true)
                sessionStorage.setItem('gabzab_admin_auth', 'true')
                fetchAllData()
                return
            }
            setLoginError('Invalid credentials')
        } catch (err) {
            if (username === 'admin' && password === 'admin123') { // Network error fallback
                setIsAuthenticated(true)
                sessionStorage.setItem('gabzab_admin_auth', 'true')
                fetchAllData()
            } else {
                setLoginError('Login failed')
            }
        }
    }

    const handleLogout = () => {
        setIsAuthenticated(false)
        sessionStorage.removeItem('gabzab_admin_auth')
        setUsername('')
        setPassword('')
    }

    // --- HANDLERS ---
    const updateOrderStatus = async (id, status) => {
        await supabase.from('orders').update({ status }).eq('id', id)
        fetchOrders()
    }

    const handleDeleteItem = async (id) => {
        if (confirm('Are you sure you want to delete this item?')) {
            await supabase.from('menu_items').delete().eq('id', id)
            fetchMenuItems()
        }
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        try {
            setIsUploading(true)
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}.${fileExt}`
            const filePath = `menu_items/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('menu_assets')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data } = supabase.storage
                .from('menu_assets')
                .getPublicUrl(filePath)

            if (data) {
                setItemForm(prev => ({ ...prev, image: data.publicUrl }))
            }
        } catch (error) {
            alert('Error uploading image: ' + error.message)
        } finally {
            setIsUploading(false)
        }
    }

    const openEditItem = (item) => {
        setEditingItem(item)
        setItemForm({
            name: item.name,
            description: item.description || '',
            price: item.price,
            promo_price: item.promo_price || '',
            category_id: item.category_id,
            image: item.image || '',
            out_of_stock: item.out_of_stock,
            sort_order: item.sort_order || 0,
            variations: Array.isArray(item.variations) ? item.variations : [],
            flavors: Array.isArray(item.flavors) ? item.flavors : [],
            addons: Array.isArray(item.addons) ? item.addons : []
        })
        setIsAddingItem(true)
    }

    const handleSaveItem = async (e) => {
        e.preventDefault()
        const payload = {
            ...itemForm,
            variations: itemForm.variations,
            flavors: itemForm.flavors,
            addons: itemForm.addons,
            promo_price: itemForm.promo_price || null
        }

        if (editingItem) {
            await supabase.from('menu_items').update(payload).eq('id', editingItem.id)
        } else {
            await supabase.from('menu_items').insert([payload])
        }
        setIsAddingItem(false)
        setEditingItem(null)
        setItemForm({ name: '', description: '', price: '', promo_price: '', category_id: '', image: '', out_of_stock: false, sort_order: 0, variations: [], flavors: [], addons: [] })
        fetchMenuItems()
    }

    const handleAddCategory = async (e) => {
        e.preventDefault()
        const id = newCategoryName.toLowerCase().replace(/\s+/g, '-')
        await supabase.from('categories').insert([{ id, name: newCategoryName, sort_order: categories.length + 1 }])
        setNewCategoryName('')
        fetchCategories()
    }

    const handleDeleteCategory = async (id) => {
        if (confirm('Delete this category?')) {
            await supabase.from('categories').delete().eq('id', id)
            fetchCategories()
        }
    }

    const handleSaveSettings = async (e) => {
        e.preventDefault()
        await supabase.from('store_settings').update(storeSettings).eq('id', storeSettings.id)
        alert('Settings saved!')
    }

    const togglePayment = async (id, currentStatus) => {
        await supabase.from('payment_settings').update({ is_active: !currentStatus }).eq('id', id)
        fetchPaymentSettings()
    }

    const handleSavePaymentSettings = async (id, field, value) => {
        await supabase.from('payment_settings').update({ [field]: value }).eq('id', id)
    }

    const toggleOrderType = async (id, currentStatus) => {
        await supabase.from('order_types').update({ is_active: !currentStatus }).eq('id', id)
        fetchOrderTypes()
    }

    // --- VIEW ---
    if (!isAuthenticated) {
        return (
            <div className="admin-login-wrapper">
                <form onSubmit={handleLogin} autoComplete="off" className="admin-login-card">
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h2 className="admin-logo-text">Gabzab</h2>
                        <span className="admin-logo-sub">Admin Portal</span>
                    </div>

                    {loginError && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>{loginError}</div>}

                    <div className="admin-input-group">
                        <label className="admin-input-label">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="username"
                            autoComplete="off"
                            className="admin-input"
                        />
                    </div>

                    <div className="admin-input-group" style={{ marginBottom: '2rem' }}>
                        <label className="admin-input-label">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="password"
                            autoComplete="new-password"
                            className="admin-input"
                        />
                    </div>

                    <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '12px' }}>Sign In</button>

                    <div className="admin-hint-box">
                        <p style={{ margin: 0, fontWeight: 600 }}>
                            Credentials:<br />
                            User: <span style={{ fontFamily: 'monospace' }}>admin</span><br />
                            Pass: <span style={{ fontFamily: 'monospace' }}>admin123</span>
                        </p>
                    </div>
                </form>
            </div>
        )
    }

    return (
        <div className="admin-dashboard-container">
            {/* SIDEBAR */}
            <aside className="admin-sidebar">
                <div className="admin-sidebar-header">
                    <h1 className="admin-logo-text">Gabzab</h1>
                    <span className="admin-logo-sub">Admin Panel</span>
                </div>

                <nav className="admin-nav">
                    {[
                        { id: 'orders', label: 'Orders', icon: '📦' },
                        { id: 'menuItems', label: 'Menu Items', icon: '🍔' },
                        { id: 'categories', label: 'Categories', icon: '🏷️' },
                        { id: 'settings', label: 'Store Settings', icon: '⚙️' },
                        { id: 'paymentSettings', label: 'Payments', icon: '💳' },
                        { id: 'orderTypes', label: 'Order Types', icon: '🛵' }
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id === 'paymentSettings' ? 'settings' : item.id)}
                            className={`admin-nav-btn ${activeTab === (item.id === 'paymentSettings' ? 'settings' : item.id) ? 'active' : ''}`}
                        >
                            <span>{item.icon}</span> {item.label}
                        </button>
                    ))}
                </nav>

                <div className="admin-footer">
                    <button onClick={handleLogout} className="admin-signout-btn">
                        <span>🚪</span> Sign Out
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="admin-main">
                <header className="admin-topbar">
                    <h2 className="admin-page-title">
                        {activeTab === 'settings' && paymentSettings.length === 0 ? 'Loading...' : activeTab.replace(/([A-Z])/g, ' $1')}
                    </h2>
                    <div className="admin-user-profile">
                        <div className="admin-user-avatar">
                            {username.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>Admin User</span>
                    </div>
                </header>

                <div className="admin-content-wrapper">

                    {/* --- ORDERS TAB --- */}
                    {activeTab === 'orders' && (
                        <div className="admin-card">
                            <div className="admin-table-wrapper">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Order #</th>
                                            <th>Date / Time</th>
                                            <th>Customer</th>
                                            <th>Details</th>
                                            <th>Total</th>
                                            <th>Status</th>
                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.length === 0 ? (
                                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No active orders found.</td></tr>
                                        ) : orders.map(o => (
                                            <tr key={o.id}>
                                                <td style={{ fontFamily: 'monospace', color: '#64748b' }}>#{o.id.slice(0, 6)}</td>
                                                <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                    {formatDate(o.timestamp || o.created_at)}
                                                </td>
                                                <td>
                                                    <strong style={{ color: '#334155' }}>{o.customer_details?.full_name || 'Guest'}</strong><br />
                                                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{o.customer_details?.phone}</span>
                                                </td>
                                                <td>
                                                    <span className="badge-pill">{o.order_type}</span> <span className="badge-pill" style={{ background: '#e0f2fe', color: '#0369a1' }}>{o.payment_method}</span>
                                                </td>
                                                <td style={{ fontWeight: '700', color: 'var(--primary)' }}>₱{o.total_amount}</td>
                                                <td><span className={`admin-status-badge ${o.status?.toLowerCase().replace(/\s/g, '')}`}>{o.status}</span></td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button onClick={() => setSelectedOrder(o)} className="icon-btn" style={{ marginRight: '0.5rem', color: 'var(--primary)' }}>👁️</button>
                                                    <select
                                                        value={o.status || 'Pending'}
                                                        onChange={e => updateOrderStatus(o.id, e.target.value)}
                                                        className="admin-input"
                                                        style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="Preparing">Preparing</option>
                                                        <option value="Out for Delivery">Out for Delivery</option>
                                                        <option value="Delivered">Delivered</option>
                                                        <option value="Cancelled">Cancelled</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- MENU ITEMS TAB --- */}
                    {activeTab === 'menuItems' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                                <button className="btn-primary" style={{ padding: '0.8rem 1.5rem', fontSize: '0.9rem' }} onClick={() => { setIsAddingItem(true); setEditingItem(null); setItemForm({ name: '', description: '', price: '', promo_price: '', category_id: '', image: '', out_of_stock: false, sort_order: 0, variations: [], flavors: [], addons: [] }) }}>+ Add New Item</button>
                            </div>

                            {(isAddingItem || editingItem) && (
                                <div className="admin-card">
                                    <div className="admin-card-header">
                                        <h3 className="admin-card-title">{editingItem ? 'Edit Product' : 'Create New Product'}</h3>
                                    </div>
                                    <div className="admin-card-body">
                                        <form onSubmit={handleSaveItem} className="admin-form-grid">
                                            {/* Basic Info */}
                                            <div style={{ gridColumn: 'span 8' }}>
                                                <label className="admin-input-label">Product Name</label>
                                                <input type="text" value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} required className="admin-input" />
                                            </div>
                                            <div style={{ gridColumn: 'span 4' }}>
                                                <label className="admin-input-label">Category</label>
                                                <select value={itemForm.category_id} onChange={e => setItemForm({ ...itemForm, category_id: e.target.value })} required className="admin-input">
                                                    <option value="">Select Category</option>
                                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            </div>

                                            <div style={{ gridColumn: 'span 4' }}>
                                                <label className="admin-input-label">Price (₱)</label>
                                                <input type="number" value={itemForm.price} onChange={e => setItemForm({ ...itemForm, price: e.target.value })} required className="admin-input" />
                                            </div>
                                            <div style={{ gridColumn: 'span 4' }}>
                                                <label className="admin-input-label">Promo Price (₱)</label>
                                                <input type="number" value={itemForm.promo_price} onChange={e => setItemForm({ ...itemForm, promo_price: e.target.value })} placeholder="Optional" className="admin-input" />
                                            </div>
                                            <div style={{ gridColumn: 'span 4' }}>
                                                <label className="admin-input-label">Sort Order</label>
                                                <input type="number" value={itemForm.sort_order} onChange={e => setItemForm({ ...itemForm, sort_order: e.target.value })} className="admin-input" />
                                            </div>

                                            <div style={{ gridColumn: 'span 12' }}>
                                                <label className="admin-input-label">Image</label>
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        disabled={isUploading}
                                                        className="admin-input"
                                                        style={{ width: 'auto' }}
                                                    />
                                                    {isUploading && <span style={{ fontSize: '0.9rem', color: '#f59e0b' }}>Uploading...</span>}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={itemForm.image}
                                                    onChange={e => setItemForm({ ...itemForm, image: e.target.value })}
                                                    placeholder="Image URL (or upload file above)"
                                                    className="admin-input"
                                                    style={{ marginTop: '0.5rem', background: '#f8fafc', color: '#64748b' }}
                                                />
                                            </div>
                                            <div style={{ gridColumn: 'span 12' }}>
                                                <label className="admin-input-label">Description</label>
                                                <textarea value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} rows={3} className="admin-input"></textarea>
                                            </div>

                                            {/* Variations */}
                                            <div style={{ gridColumn: 'span 4', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Variations (Size)</h4>
                                                <div style={{ marginBottom: '0.5rem' }}>
                                                    {itemForm.variations.map((v, idx) => (
                                                        <div key={idx} className="badge-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginRight: '5px', marginBottom: '5px', background: 'white', border: '1px solid #e2e8f0' }}>
                                                            {v.name} (+{v.price}) <span onClick={() => { const n = [...itemForm.variations]; n.splice(idx, 1); setItemForm({ ...itemForm, variations: n }) }} style={{ cursor: 'pointer', color: 'red', fontWeight: 'bold' }}>×</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <input id="vN" placeholder="Name" style={{ width: '50%', padding: '0.3rem' }} />
                                                    <input id="vP" type="number" placeholder="Price" style={{ width: '30%', padding: '0.3rem' }} />
                                                    <button type="button" onClick={() => { const n = document.getElementById('vN').value; const p = document.getElementById('vP').value; if (n) { setItemForm({ ...itemForm, variations: [...itemForm.variations, { name: n, price: p || 0 }] }); document.getElementById('vN').value = ''; document.getElementById('vP').value = ''; } }} className="btn-secondary" style={{ padding: '0.3rem', fontSize: '0.8rem', background: 'var(--primary)', color: 'white', border: 'none' }}>Add</button>
                                                </div>
                                            </div>

                                            {/* Flavors */}
                                            <div style={{ gridColumn: 'span 4', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Flavors</h4>
                                                <div style={{ marginBottom: '0.5rem' }}>
                                                    {itemForm.flavors.map((v, idx) => (
                                                        <div key={idx} className="badge-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginRight: '5px', marginBottom: '5px', background: 'white', border: '1px solid #e2e8f0' }}>
                                                            {v.name} <span onClick={() => { const n = [...itemForm.flavors]; n.splice(idx, 1); setItemForm({ ...itemForm, flavors: n }) }} style={{ cursor: 'pointer', color: 'red', fontWeight: 'bold' }}>×</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <input id="fN" placeholder="Name" style={{ width: '70%', padding: '0.3rem' }} />
                                                    <button type="button" onClick={() => { const n = document.getElementById('fN').value; if (n) { setItemForm({ ...itemForm, flavors: [...itemForm.flavors, { name: n }] }); document.getElementById('fN').value = ''; } }} className="btn-secondary" style={{ padding: '0.3rem', fontSize: '0.8rem', background: 'var(--primary)', color: 'white', border: 'none' }}>Add</button>
                                                </div>
                                            </div>

                                            {/* Addons */}
                                            <div style={{ gridColumn: 'span 4', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Add-ons</h4>
                                                <div style={{ marginBottom: '0.5rem' }}>
                                                    {itemForm.addons.map((v, idx) => (
                                                        <div key={idx} className="badge-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginRight: '5px', marginBottom: '5px', background: 'white', border: '1px solid #e2e8f0' }}>
                                                            {v.name} (+{v.price}) <span onClick={() => { const n = [...itemForm.addons]; n.splice(idx, 1); setItemForm({ ...itemForm, addons: n }) }} style={{ cursor: 'pointer', color: 'red', fontWeight: 'bold' }}>×</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <input id="aN" placeholder="Name" style={{ width: '50%', padding: '0.3rem' }} />
                                                    <input id="aP" type="number" placeholder="Price" style={{ width: '30%', padding: '0.3rem' }} />
                                                    <button type="button" onClick={() => { const n = document.getElementById('aN').value; const p = document.getElementById('aP').value; if (n && p) { setItemForm({ ...itemForm, addons: [...itemForm.addons, { name: n, price: p }] }); document.getElementById('aN').value = ''; document.getElementById('aP').value = ''; } }} className="btn-secondary" style={{ padding: '0.3rem', fontSize: '0.8rem', background: 'var(--primary)', color: 'white', border: 'none' }}>Add</button>
                                                </div>
                                            </div>

                                            <div style={{ gridColumn: 'span 12', paddingTop: '1rem', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div className="switch-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <label className="switch">
                                                        <input type="checkbox" checked={itemForm.out_of_stock} onChange={e => setItemForm({ ...itemForm, out_of_stock: e.target.checked })} />
                                                        <span className="slider round"></span>
                                                    </label>
                                                    <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Mark as Out of Stock</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '1rem' }}>
                                                    <button type="button" className="btn-secondary" onClick={() => { setIsAddingItem(false); setEditingItem(null); }} style={{ borderRadius: '8px', padding: '0.8rem 1.5rem', border: '1px solid #e2e8f0' }}>Cancel</button>
                                                    <button type="submit" className="btn-primary" style={{ borderRadius: '8px', padding: '0.8rem 2rem', border: 'none' }}>Save Product</button>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            <div className="admin-card">
                                <div className="admin-table-wrapper">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '80px' }}>Img</th>
                                                <th>Product Name</th>
                                                <th>Price</th>
                                                <th>Category</th>
                                                <th>Stock</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {menuItems.map(item => (
                                                <tr key={item.id}>
                                                    <td>
                                                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', background: '#f1f5f9' }}>
                                                            <img src={item.image || 'placeholder.jpg'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.target.style.display = 'none'} />
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <strong style={{ color: '#334155' }}>{item.name}</strong>
                                                        {item.description && <div style={{ fontSize: '0.8rem', color: '#94a3b8', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.description}</div>}
                                                    </td>
                                                    <td>
                                                        {item.promo_price ? <div><s style={{ opacity: 0.5, fontSize: '0.8rem' }}>₱{item.price}</s> <span style={{ color: 'var(--primary)', fontWeight: '700' }}>₱{item.promo_price}</span></div> : <span style={{ fontWeight: 600 }}>₱{item.price}</span>}
                                                    </td>
                                                    <td><span className="badge-pill">{categories.find(c => c.id === item.category_id)?.name || item.category_id}</span></td>
                                                    <td>{item.out_of_stock ? <span className="admin-status-badge cancelled">Sold Out</span> : <span className="admin-status-badge outfordelivery">In Stock</span>}</td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <button onClick={() => openEditItem(item)} className="icon-btn edit">✏️</button>
                                                        <button onClick={() => handleDeleteItem(item.id)} className="icon-btn delete">🗑️</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- CATEGORIES TAB --- */}
                    {activeTab === 'categories' && (
                        <div>
                            <div className="admin-card" style={{ maxWidth: '600px', margin: '0 auto 2rem auto' }}>
                                <div className="admin-card-header">
                                    <h3 className="admin-card-title">Add New Category</h3>
                                </div>
                                <div className="admin-card-body">
                                    <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '1rem' }}>
                                        <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Category Name..." required className="admin-input" style={{ flexGrow: 1 }} />
                                        <button type="submit" className="btn-primary" style={{ padding: '0 1.5rem', borderRadius: '10px' }}>Add</button>
                                    </form>
                                </div>
                            </div>

                            <div className="admin-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                                <div className="admin-table-wrapper">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Sort</th>
                                                <th>Category Name</th>
                                                <th>ID Slug</th>
                                                <th style={{ textAlign: 'right' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categories.map((cat, idx) => (
                                                <tr key={cat.id}>
                                                    <td style={{ color: '#94a3b8', fontWeight: 'bold' }}>{cat.sort_order || idx + 1}</td>
                                                    <td style={{ fontWeight: '700', color: '#334155' }}>{cat.name}</td>
                                                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#64748b' }}>{cat.id}</td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <button onClick={() => handleDeleteCategory(cat.id)} className="icon-btn delete">🗑️</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- SETTINGS TAB --- */}
                    {activeTab === 'settings' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
                            <div className="admin-card" style={{ gridColumn: 'span 7' }}>
                                <div className="admin-card-header">
                                    <h3 className="admin-card-title">Store Configuration</h3>
                                </div>
                                <div className="admin-card-body">
                                    <form onSubmit={handleSaveSettings} className="admin-form-grid">
                                        <div style={{ gridColumn: 'span 6' }}>
                                            <label className="admin-input-label">Store Name</label>
                                            <input type="text" value={storeSettings.store_name || ''} onChange={e => setStoreSettings({ ...storeSettings, store_name: e.target.value })} className="admin-input" />
                                        </div>
                                        <div style={{ gridColumn: 'span 6' }}>
                                            <label className="admin-input-label">Contact Number</label>
                                            <input type="text" value={storeSettings.contact || ''} onChange={e => setStoreSettings({ ...storeSettings, contact: e.target.value })} className="admin-input" />
                                        </div>
                                        <div style={{ gridColumn: 'span 12' }}>
                                            <label className="admin-input-label">Address</label>
                                            <input type="text" value={storeSettings.address || ''} onChange={e => setStoreSettings({ ...storeSettings, address: e.target.value })} className="admin-input" />
                                        </div>
                                        <div style={{ gridColumn: 'span 6' }}>
                                            <label className="admin-input-label">Opening Time</label>
                                            <input type="time" value={storeSettings.open_time || ''} onChange={e => setStoreSettings({ ...storeSettings, open_time: e.target.value })} className="admin-input" />
                                        </div>
                                        <div style={{ gridColumn: 'span 6' }}>
                                            <label className="admin-input-label">Closing Time</label>
                                            <input type="time" value={storeSettings.close_time || ''} onChange={e => setStoreSettings({ ...storeSettings, close_time: e.target.value })} className="admin-input" />
                                        </div>
                                        <div style={{ gridColumn: 'span 12' }}>
                                            <label className="admin-input-label">Manual Status Override</label>
                                            <select value={storeSettings.manual_status || 'auto'} onChange={e => setStoreSettings({ ...storeSettings, manual_status: e.target.value })} className="admin-input">
                                                <option value="auto">Auto (Schedule Based)</option>
                                                <option value="open">Force Open</option>
                                                <option value="closed">Force Closed</option>
                                            </select>
                                        </div>
                                        <div style={{ gridColumn: 'span 12', marginTop: '1rem' }}>
                                            <button type="submit" className="btn-primary" style={{ width: '100%', borderRadius: '10px' }}>Save Settings</button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            <div className="admin-card" style={{ gridColumn: 'span 5', height: 'fit-content' }}>
                                <div className="admin-card-header">
                                    <h3 className="admin-card-title">Payment Methods</h3>
                                </div>
                                <div className="admin-card-body">
                                    {paymentSettings.map(pm => (
                                        <div key={pm.id} style={{ marginBottom: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: pm.is_active ? '#f0fdf4' : '#f8fafc', borderBottom: pm.is_active ? '1px solid #dcfce7' : '1px solid #e2e8f0' }}>
                                                <h4 style={{ margin: 0, fontSize: '1rem', color: pm.is_active ? '#166534' : '#64748b' }}>{pm.name}</h4>
                                                <label className="switch">
                                                    <input type="checkbox" checked={pm.is_active} onChange={() => togglePayment(pm.id, pm.is_active)} />
                                                    <span className="slider round"></span>
                                                </label>
                                            </div>
                                            {pm.is_active && (
                                                <div style={{ padding: '1rem', display: 'grid', gap: '1rem', background: 'white' }}>
                                                    <div>
                                                        <label className="admin-input-label">Account Name</label>
                                                        <input type="text" value={pm.account_name || ''} onChange={e => {
                                                            const newVal = e.target.value;
                                                            setPaymentSettings(curr => curr.map(p => p.id === pm.id ? { ...p, account_name: newVal } : p));
                                                        }} onBlur={e => handleSavePaymentSettings(pm.id, 'account_name', e.target.value)} className="admin-input" />
                                                    </div>
                                                    <div>
                                                        <label className="admin-input-label">Account No.</label>
                                                        <input type="text" value={pm.account_number || ''} onChange={e => {
                                                            const newVal = e.target.value;
                                                            setPaymentSettings(curr => curr.map(p => p.id === pm.id ? { ...p, account_number: newVal } : p));
                                                        }} onBlur={e => handleSavePaymentSettings(pm.id, 'account_number', e.target.value)} className="admin-input" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- ORDER TYPES TAB --- */}
                    {
                        activeTab === 'orderTypes' && (
                            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                                <div className="admin-card">
                                    <div className="admin-card-header">
                                        <h3 className="admin-card-title">Fulfillment Options</h3>
                                    </div>
                                    <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {orderTypes.map(ot => (
                                            <div key={ot.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: ot.is_active ? 'white' : '#f8fafc', borderRadius: '12px', border: ot.is_active ? '2px solid var(--primary)' : '1px solid #e2e8f0', transition: 'all 0.2s' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                                    <div style={{ fontSize: '2rem', width: '60px', height: '60px', background: ot.is_active ? 'rgba(255,0,0,0.1)' : '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {ot.id === 'pickup' ? '🛍️' : ot.id === 'delivery' ? '🛵' : '🍽️'}
                                                    </div>
                                                    <div>
                                                        <h4 style={{ margin: 0, fontSize: '1.2rem', marginBottom: '0.2rem' }}>{ot.name}</h4>
                                                        <span style={{ color: ot.is_active ? '#166534' : '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>{ot.is_active ? 'Currently Active' : 'Disabled'}</span>
                                                    </div>
                                                </div>
                                                <label className="switch" style={{ transform: 'scale(1.2)' }}>
                                                    <input type="checkbox" checked={ot.is_active} onChange={() => toggleOrderType(ot.id, ot.is_active)} />
                                                    <span className="slider round"></span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </div >

                {/* ORDER DETAILS MODAL */}
                {selectedOrder && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                        zIndex: 3000, backdropFilter: 'blur(5px)'
                    }} onClick={() => setSelectedOrder(null)}>
                        <div style={{
                            background: 'white', padding: '2rem', borderRadius: '12px',
                            width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                        }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#000000' }}>Order Details</h3>
                                    <span style={{ fontFamily: 'monospace', color: '#000000', fontSize: '0.9rem', fontWeight: 'bold' }}>#{selectedOrder.id}</span>
                                </div>
                                <button onClick={() => setSelectedOrder(null)} style={{ fontSize: '1.5rem', color: '#000000', padding: '0.5rem', cursor: 'pointer' }}>&times;</button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                <div>
                                    <h4 style={{ color: '#000000', marginBottom: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Customer Info</h4>
                                    <p style={{ margin: 0, fontWeight: '700', color: '#000000' }}>{selectedOrder.customer_details?.full_name || 'Guest Customer'}</p>
                                    <p style={{ margin: 0, color: '#000000' }}>{selectedOrder.customer_details?.phone || 'No Phone'}</p>
                                    <p style={{ margin: 0, color: '#000000' }}>{selectedOrder.customer_details?.email || ''}</p>
                                    <p style={{ margin: 0, color: '#000000' }}>{selectedOrder.customer_details?.address || selectedOrder.customer_details?.table_number || 'No Address Provided'}</p>
                                </div>
                                <div>
                                    <h4 style={{ color: '#000000', marginBottom: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Order Type</h4>
                                    <span className="badge-pill" style={{ background: '#fef3c7', color: '#92400e', marginBottom: '0.5rem', display: 'inline-block' }}>{selectedOrder.order_type?.toUpperCase() || 'UNKNOWN'}</span>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', fontWeight: '600' }}>
                                        PLACED ON: {formatDate(selectedOrder.timestamp || selectedOrder.created_at)}
                                    </p>
                                </div>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <h4 style={{ color: '#000000', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Order Items</h4>
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead style={{ background: '#f8fafc' }}>
                                            <tr>
                                                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', color: '#000000', fontWeight: 'bold' }}>Item / Customization</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.85rem', color: '#000000', fontWeight: 'bold' }}>Qty</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.85rem', color: '#000000', fontWeight: 'bold' }}>Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrder.items?.map((item, idx) => (
                                                <tr key={idx} style={{ borderTop: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <div style={{ fontWeight: '700', color: '#000000' }}>{item.customTitle || item.title || 'Unknown Item'}</div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#000000' }}>{item.quantity}</td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#000000' }}>₱{Number(item.price).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#000000' }}>Payment Method: <span style={{ fontWeight: '700' }}>{selectedOrder.payment_method?.toUpperCase()}</span></p>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#000000' }}>Status: <span style={{ fontWeight: '700', color: '#000000' }}>{selectedOrder.status}</span></p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#000000' }}>Total Amount</p>
                                    <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: '#000000' }}>₱{Number(selectedOrder.total_amount).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main >
        </div >
    )
}
