from playwright.sync_api import sync_playwright
from datetime import datetime, timedelta

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Log in as admin
    page.goto("http://localhost:3306/login")
    page.get_by_label("Username").fill("manuel")
    page.get_by_label("Password").fill("manuel123")
    page.get_by_role("button", name="Login").click()
    page.wait_for_url("http://localhost:3306/")

    # Go to create membership page
    page.goto("http://localhost:3306/memberships/createMembership")

    # Create a new client
    page.get_by_label("Nombre Completo *").fill("Test User Expiring Today")
    page.get_by_label("Teléfono").fill("123456789")
    page.get_by_label("Correo Electrónico").fill("test@example.com")
    page.get_by_role("button", name="Registrar Cliente").click()
    page.get_by_role("button", name="Confirmar").click()


    # Fill out membership form
    page.wait_for_selector("#id_cliente")
    page.select_option("#id_tipo_membresia", label="Individual")

    # Set start date to 30 days ago
    start_date = datetime.now() - timedelta(days=30)
    start_date_str = start_date.strftime("%Y-%m-%d")
    page.locator("#fecha_inicio").fill(start_date_str)

    page.get_by_label("Método de Pago *").select_option(label="Efectivo")


    # Submit the form
    page.get_by_role("button", name="Crear Membresía").click()
    page.get_by_role("button", name="Confirmar").click()

    page.screenshot(path="jules-scratch/verification/test_data_creation.png")

    # ---------------------
    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
