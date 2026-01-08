import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import logo from './assets/logo_brand.jpg'
import heroImg from './assets/hero.jpg'
import FullDetailsModal from './FullDetailsModal'

function Home() {
    const [menuItems, setMenuItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [cart, setCart] = useState([])
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [filter, setFilter] = useState('All')
    const [checkoutStep, setCheckoutStep] = useState('cart') // cart, shipping, success
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [orderType, setOrderType] = useState('delivery')
    const [paymentMethod, setPaymentMethod] = useState('cod')
    const [lastOrder, setLastOrder] = useState(null)

    useEffect(() => {
        fetchMenuItems()
    }, [])

    const fetchMenuItems = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('menu_items')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setMenuItems(data || [])
        } catch (err) {
            console.error('Error fetching menu items:', err.message)
            setError('Failed to load menu. Please try again later.')
        } finally {
            setLoading(false)
        }
    }

    const addToCart = (item) => {
        const quantityToAdd = item.quantity || 1
        const existingItem = cart.find(cartItem => cartItem.id === item.id)
        if (existingItem) {
            setCart(cart.map(cartItem =>
                cartItem.id === item.id
                    ? { ...cartItem, quantity: (cartItem.quantity || 1) + quantityToAdd }
                    : cartItem
            ))
            setIsCartOpen(true)
        } else {
            setCart([...cart, { ...item, quantity: quantityToAdd }])
            setIsCartOpen(true)
            setCheckoutStep('cart')
        }
    }

    const updateQuantity = (id, change) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQuantity = (item.quantity || 1) + change
                return newQuantity > 0 ? { ...item, quantity: newQuantity } : item
            }
            return item
        }))
    }

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.id !== id))
    }


    const handleCheckout = async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const orderData = {
            full_name: formData.get('fullName'),
            email: 'guest@midnightcanteen.com',
            phone: formData.get('phone'),
            address: orderType === 'delivery'
                ? `${formData.get('address')} ${formData.get('location') ? `(Landmark: ${formData.get('location')})` : ''}`
                : 'Dine In',
            order_type: orderType,
            table_number: orderType === 'dine-in' ? formData.get('tableNumber') : null,
            payment_method: paymentMethod,
            total_amount: cartTotal,
            items: cart,
            status: 'pending'
        }

        try {
            setIsSubmitting(true)
            const { data, error } = await supabase
                .from('orders')
                .insert([orderData])
                .select()
                .single()

            if (error) throw error

            setLastOrder(data)
            setCheckoutStep('success')
            setCart([])
        } catch (err) {
            alert('Error processing order: ' + err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredItems = menuItems.filter(p => {
        const matchesCategory = filter === 'All' || p.category === filter
        return matchesCategory
    })

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)

    return (
        <div className="home">
            {/* Top Banner */}
            <div className="top-banner">
                📍 Purok Adelfa, Poblacion North, San Fernando, Philippines | 📞 0936 908 7295 | 🕒 4PM - 12AM
            </div>

            {/* Navbar */}
            <nav className="navbar">
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div className="brand" style={{ display: 'flex', alignItems: 'center' }}>
                        <img src={logo} alt="The Midnight Canteen Logo" style={{ height: '45px', width: '45px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--accent)' }} />
                    </div>
                    <button className="cart-icon" onClick={() => { setIsCartOpen(true); setCheckoutStep('cart') }}>
                        🛒 <span className="cart-count">{cart.length}</span>
                    </button>
                </div>
            </nav>
            <div className="sub-header" style={{ position: 'sticky', top: '90px', zIndex: 999, backgroundColor: 'var(--glass-midnight)', padding: '1rem 0', borderBottom: '1px solid var(--border-light)', backdropFilter: 'blur(10px)' }}>
                {/* Categories Slider */}
                <div className="container" style={{
                    display: 'flex',
                    overflowX: 'auto',
                    gap: '0.8rem',
                    whiteSpace: 'nowrap',
                    paddingBottom: '5px',
                    scrollbarWidth: 'none', /* Firefox */
                    msOverflowStyle: 'none'  /* IE 10+ */
                }}>
                    {/* Hide scrollbar for Chrome/Safari/Opera */}
                    <style>{`
                       .container::-webkit-scrollbar { 
                           display: none; 
                       }
                   `}</style>
                    {['All', 'Wings Series', 'Silog Series', 'Noodles', 'Classic Milktea Series', 'Fruit Tea Series', 'Refreshers', 'Platters'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => {
                                setFilter(cat);
                                document.getElementById('menu').scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className={`category-btn ${filter === cat ? 'active' : ''}`}
                            style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem', flexShrink: 0 }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>


            {/* Menu Section */}
            <section className="gallery-section" id="menu">
                <div className="container">
                    <div className="section-title" style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 className="logo-branding" style={{ fontSize: '3.5rem', marginBottom: '1rem', display: 'block' }}>Our Menu</h2>
                        <p style={{ fontFamily: 'Alfa Slab One, serif', fontSize: '1.2rem', color: 'var(--c-gold)', letterSpacing: '1px', textShadow: '2px 2px 0px #000' }}>
                            CRAVE FULFILLED, RIGHT AT YOUR DOORSTEP! 🍴👋
                        </p>
                        <p style={{ color: 'var(--text-light)', fontSize: '1.1rem', marginTop: '0.8rem', fontWeight: '500' }}>
                            Book your orders now and satisfy your cravings! 📦
                        </p>
                    </div>


                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '5rem' }}>
                            <div className="loader">Preparing Delicious Food...</div>
                        </div>
                    ) : error ? (
                        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--c-gold)' }}>
                            <p>{error}</p>
                            <button onClick={fetchMenuItems} style={{ marginTop: '1rem', textDecoration: 'underline' }}>Try Again</button>
                        </div>
                    ) : (
                        <>
                            <div className="gallery-grid">
                                {filteredItems.map(item => (
                                    <div key={item.id} className="painting-card">
                                        <div className="painting-image-container">
                                            <img src={item.image} alt={item.title} className="painting-image" />
                                        </div>
                                        <div className="painting-info">
                                            <h3 className="painting-title">{item.title}</h3>
                                            <p className="item-description-short">{item.description || 'Deliciously prepared with our signature recipe.'}</p>
                                            <p className="painting-price">₱{Number(item.price).toLocaleString()}</p>
                                            <button
                                                className="btn-view-details"
                                                onClick={() => {
                                                    setSelectedItem(item)
                                                    setIsModalOpen(true)
                                                }}
                                                style={{ marginTop: '1rem', background: 'var(--c-gold)', color: 'var(--c-midnight)', fontWeight: '700', border: 'none' }}
                                            >
                                                Customize
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '2rem 0', backgroundColor: '#0a0a0c', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                </div>
            </footer>

            {/* Cart Panel Shell */}
            <div className={`cart-panel ${isCartOpen ? 'open' : ''}`}>
                <div className="cart-header">
                    <h3>{checkoutStep === 'cart' ? 'Your Order' : checkoutStep === 'success' ? 'Order Complete' : 'Order Details'}</h3>
                    <button onClick={() => setIsCartOpen(false)} style={{ fontSize: '1.5rem' }}>&times;</button>
                </div>

                {checkoutStep === 'cart' && (
                    <>
                        <div className="cart-items">
                            {cart.length === 0 ? (
                                <p style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-light)' }}>Your order list is empty.</p>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="cart-item">
                                        <img src={item.image} alt={item.title} className="cart-item-img" />
                                        <div className="cart-item-details">
                                            <h4>{item.customTitle || item.title}</h4>
                                            <p>₱{Number(item.price).toLocaleString()}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', padding: '0.2rem', borderRadius: '4px' }}>
                                                    <button onClick={() => updateQuantity(item.id, -1)} style={{ color: 'white', fontSize: '1rem', width: '25px', height: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                                                    <span style={{ fontWeight: 'bold' }}>{item.quantity || 1}</span>
                                                    <button onClick={() => updateQuantity(item.id, 1)} style={{ color: 'white', fontSize: '1rem', width: '25px', height: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                                </div>
                                                <button onClick={() => removeFromCart(item.id)} style={{ color: 'var(--c-gold)', fontSize: '0.8rem', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Remove</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {cart.length > 0 && (
                            <div className="cart-footer">
                                <div className="cart-total">
                                    <span>Total</span>
                                    <span>₱{cartTotal.toLocaleString()}</span>
                                </div>
                                <button className="btn-primary" style={{ width: '100%' }} onClick={() => setCheckoutStep('shipping')}>Proceed to Checkout</button>
                            </div>
                        )}
                    </>
                )}

                {checkoutStep === 'shipping' && (
                    <div className="cart-items">
                        <form className="checkout-form" onSubmit={handleCheckout}>
                            <div className="form-group">
                                <label>Order Type</label>
                                <select
                                    name="orderType"
                                    value={orderType}
                                    onChange={(e) => setOrderType(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--c-gold)', background: 'var(--glass-midnight)', color: 'white' }}
                                >
                                    <option value="delivery">🚀 Delivery</option>
                                    <option value="dine-in">🍽️ Dine In</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Full Name</label>
                                <input name="fullName" type="text" required placeholder="Your Name" />
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input name="phone" type="tel" required placeholder="e.g. 09123456789" />
                            </div>


                            {orderType === 'delivery' ? (
                                <>
                                    <div className="form-group">
                                        <label>Delivery Address</label>
                                        <textarea name="address" required placeholder="House No., Street, Brgy., City" rows="3"></textarea>
                                    </div>
                                    <div className="form-group">
                                        <label>Location / Landmark</label>
                                        <input name="location" type="text" placeholder="e.g. Blue Gate, Near Chapel, etc." />
                                    </div>
                                </>
                            ) : (
                                <div className="form-group">
                                    <label>Table Number</label>
                                    <input name="tableNumber" type="text" required placeholder="e.g. Table 5" />
                                </div>
                            )}

                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label>Payment Method</label>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                    <button
                                        type="button"
                                        className={`category-btn ${paymentMethod === 'cod' ? 'active' : ''}`}
                                        onClick={() => setPaymentMethod('cod')}
                                        style={{ flex: 1 }}
                                    >
                                        💵 COD
                                    </button>
                                    <button
                                        type="button"
                                        className={`category-btn ${paymentMethod === 'gcash' ? 'active' : ''}`}
                                        onClick={() => setPaymentMethod('gcash')}
                                        style={{ flex: 1 }}
                                    >
                                        📱 GCash
                                    </button>
                                </div>
                            </div>

                            {paymentMethod === 'gcash' && (
                                <div style={{ textAlign: 'center', marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--c-gold)', marginBottom: '1rem' }}>Scan QR and Send Screenshot to our Messenger</p>
                                    <img src="/gcash_qr.jpg" alt="GCash QR Code" style={{ width: '100%', maxWidth: '200px', borderRadius: '10px' }} />
                                </div>
                            )}

                            <div className="cart-total" style={{ marginTop: '20px', borderTop: '1px solid var(--border-light)', paddingTop: '15px' }}>
                                <span>Total Amount</span>
                                <span>₱{cartTotal.toLocaleString()}</span>
                            </div>

                            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                                {isSubmitting ? 'Processing...' : 'Place Order'}
                            </button>
                            <button type="button" onClick={() => setCheckoutStep('cart')} style={{ width: '100%', marginTop: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', textDecoration: 'underline' }}>
                                Back to Cart
                            </button>
                        </form>
                    </div>
                )}

                {checkoutStep === 'success' && (
                    <div className="cart-items" style={{ textAlign: 'center', paddingTop: '1rem' }}>
                        <div style={{ fontSize: '3rem', color: 'var(--c-gold)', marginBottom: '1rem' }}>🎉</div>
                        <h2>Order Confirmed!</h2>
                        <p style={{ color: 'var(--text-light)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                            Your order has been recorded. To finish, please send your order summary to our Messenger.
                        </p>

                        {lastOrder && (
                            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', textAlign: 'left', border: '1px solid var(--c-gold)' }}>
                                <h4 style={{ color: 'var(--c-gold)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>ORDER SUMMARY</h4>
                                <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '1rem' }}>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}><strong>Customer:</strong> {lastOrder.full_name}</p>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}><strong>Phone:</strong> {lastOrder.phone}</p>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}><strong>Type:</strong> {lastOrder.order_type === 'delivery' ? 'Delivery' : 'Dine In'}</p>
                                    {lastOrder.order_type === 'delivery' ? (
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}><strong>Address:</strong> {lastOrder.address}</p>
                                    ) : (
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}><strong>Table:</strong> {lastOrder.table_number}</p>
                                    )}
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                                        {lastOrder.items.map((item, idx) => (
                                            <p key={idx} style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>🍴 {item.quantity || 1}x {item.customTitle || item.title}</p>
                                        ))}
                                    </div>
                                    <p style={{ fontWeight: 'bold', marginTop: '0.5rem', color: 'var(--c-gold)' }}>Total: ₱{lastOrder.total_amount.toLocaleString()}</p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    <button
                                        className="btn-primary"
                                        style={{ width: '100%', background: 'var(--c-gold)', color: 'var(--c-midnight)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold' }}
                                        onClick={(e) => {
                                            const btn = e.currentTarget;
                                            const originalText = '📋 Copy Order Details';
                                            const summary = `✨ *NEW ORDER - THE MIDNIGHT CANTEEN* ✨\n\n` +
                                                `🔢 *Order ID:* #${lastOrder.id}\n` +
                                                `👤 *Customer:* ${lastOrder.full_name}\n` +
                                                `📱 *Phone:* ${lastOrder.phone}\n` +
                                                `🔖 *Type:* ${lastOrder.order_type === 'delivery' ? 'Delivery' : 'Dine In'}\n` +
                                                (lastOrder.order_type === 'delivery' ? `🏡 *Address:* ${lastOrder.address}\n` : `🍽️ *Table:* ${lastOrder.table_number}\n`) +
                                                `💳 *Payment:* ${lastOrder.payment_method.toUpperCase()}\n\n` +
                                                `🛒 *ITEMS:*\n${lastOrder.items.map(i => `🍗 ${i.quantity || 1}x ${i.customTitle || i.title}`).join('\n')}\n\n` +
                                                `💰 *TOTAL AMOUNT: ₱${lastOrder.total_amount.toLocaleString()}`;

                                            navigator.clipboard.writeText(summary).then(() => {
                                                btn.innerText = '✅ Copied!';
                                                setTimeout(() => {
                                                    btn.innerText = originalText;
                                                }, 2000);
                                            }).catch(err => {
                                                console.error('Failed to copy', err);
                                                alert('Failed to copy automatically. Please take a screenshot!');
                                            });
                                        }}
                                    >
                                        📋 Copy Order Details
                                    </button>

                                    <a
                                        href="https://m.me/100064311721918"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-primary"
                                        style={{ width: '100%', background: '#0084FF', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}
                                    >
                                        💬 Open Messenger to Send
                                    </a>
                                </div>
                                <p style={{ fontSize: '0.65rem', color: 'var(--text-light)', textAlign: 'center', marginTop: '0.5rem' }}>
                                    Step 1: Copy Details &nbsp;|&nbsp; Step 2: Open Messenger & Paste
                                </p>
                            </div>
                        )}

                        <button
                            className="btn-secondary"
                            style={{ marginTop: '1.5rem', width: '100%' }}
                            onClick={() => { setIsCartOpen(false); setLastOrder(null); setCheckoutStep('cart'); }}
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>

            {/* Overlay for Cart */}
            {
                isCartOpen && (
                    <div
                        onClick={() => setIsCartOpen(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            zIndex: 1999,
                        }}
                    ></div>
                )
            }

            {/* Full Details Modal */}
            <FullDetailsModal
                painting={selectedItem}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                addToCart={addToCart}
            />
        </div >
    )
}

export default Home
