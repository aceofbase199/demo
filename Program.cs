using System.Globalization;

var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

var transactions = new List<Transaction>
{
    new(
        Id: Guid.NewGuid(),
        Title: "Morning coffee",
        Amount: -4.5m,
        Category: "Food & Drink",
        Tags: new List<string> { "Cafe", "Daily" },
        Location: "Downtown",
        Date: DateTimeOffset.Now.AddHours(-5),
        PaymentMethod: "Card"
    ),
    new(
        Id: Guid.NewGuid(),
        Title: "Metro pass",
        Amount: -22m,
        Category: "Transport",
        Tags: new List<string> { "Commute" },
        Location: "Central Station",
        Date: DateTimeOffset.Now.AddDays(-1),
        PaymentMethod: "Card"
    ),
    new(
        Id: Guid.NewGuid(),
        Title: "Freelance invoice",
        Amount: 540m,
        Category: "Income",
        Tags: new List<string> { "Client" },
        Location: "Remote",
        Date: DateTimeOffset.Now.AddDays(-2),
        PaymentMethod: "Bank"
    )
};

app.MapGet("/api/transactions", () => Results.Ok(transactions.OrderByDescending(t => t.Date)));

app.MapPost("/api/transactions", (TransactionInput input) =>
{
    var transaction = new Transaction(
        Id: Guid.NewGuid(),
        Title: input.Title,
        Amount: input.Amount,
        Category: input.Category,
        Tags: input.Tags ?? new List<string>(),
        Location: input.Location ?? "",
        Date: input.Date ?? DateTimeOffset.Now,
        PaymentMethod: input.PaymentMethod ?? ""
    );

    transactions.Add(transaction);

    return Results.Created($"/api/transactions/{transaction.Id}", transaction);
});

app.MapPost("/api/transcribe", (TranscriptionRequest request) =>
{
    if (string.IsNullOrWhiteSpace(request.Transcript))
    {
        return Results.BadRequest(new { message = "No audio transcript received." });
    }

    var normalized = request.Transcript.Trim();
    var suggestion = normalized.Contains("coffee", StringComparison.OrdinalIgnoreCase)
        ? new TransactionSuggestion("Coffee", -4.5m, "Food & Drink")
        : new TransactionSuggestion("Voice entry", -12m, "Everyday");

    return Results.Ok(new
    {
        transcript = normalized,
        suggestion,
        confidence = 0.82
    });
});

app.MapFallbackToFile("/index.html");

app.Run();

record Transaction(
    Guid Id,
    string Title,
    decimal Amount,
    string Category,
    List<string> Tags,
    string Location,
    DateTimeOffset Date,
    string PaymentMethod
)
{
    public string DateLabel => Date.ToString("MMM d, yyyy", CultureInfo.InvariantCulture);
}

record TransactionInput(
    string Title,
    decimal Amount,
    string Category,
    List<string>? Tags,
    string? Location,
    DateTimeOffset? Date,
    string? PaymentMethod
);

record TranscriptionRequest(string Transcript);

record TransactionSuggestion(string Title, decimal Amount, string Category);
